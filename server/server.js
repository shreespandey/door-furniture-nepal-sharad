import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

const ESEWA_PRODUCT_CODE = "EPAYTEST";
const ESEWA_SECRET = process.env.ESEWA_SECRET || "8gBm/:&EnhH.1/q";
const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const orders = new Map();

const randomOrderId = () =>
  "DOOR-" + Date.now().toString(36).toUpperCase() + "-" +
  crypto.randomBytes(3).toString("hex").toUpperCase();

const transactionUuid = () =>
  "DOOR-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex");

const sign = (message) =>
  crypto.createHmac("sha256", ESEWA_SECRET).update(message).digest("base64");

app.get("/api/health", (req,res)=>res.json({ok:true,store:"DOOR",esewa:"UAT"}));

app.post("/api/orders", (req,res)=>{
  const {customer,items,subtotal,delivery,total,paymentMethod}=req.body||{};
  if(!customer?.name||!customer?.phone||!customer?.address||!Array.isArray(items)||!items.length)
    return res.status(400).json({ok:false,message:"Missing order information"});
  const id=randomOrderId();
  orders.set(id,{id,customer,items,subtotal,delivery,total:Number(total),paymentMethod,status:"pending",createdAt:new Date().toISOString()});
  res.json({ok:true,orderId:id});
});

app.post("/api/orders/:id/cod",(req,res)=>{
  const order=orders.get(req.params.id);
  if(!order)return res.status(404).json({ok:false,message:"Order not found"});
  order.status="confirmed-cod";
  orders.set(order.id,order);
  res.json({ok:true,orderId:order.id,status:order.status});
});

app.post("/api/payments/esewa/initiate",(req,res)=>{
  const {orderId}=req.body||{};
  const order=orders.get(orderId);
  if(!order)return res.status(404).json({ok:false,message:"Order not found"});

  const uuid=transactionUuid();
  const total=Number(order.total).toFixed(2);
  order.transactionUuid=uuid;
  order.status="payment-pending";
  orders.set(order.id,order);

  const signedFieldNames="total_amount,transaction_uuid,product_code";
  const message=`total_amount=${total},transaction_uuid=${uuid},product_code=${ESEWA_PRODUCT_CODE}`;
  const signature=sign(message);

  res.json({
    ok:true,
    action:ESEWA_FORM_URL,
    fields:{
      amount:total,
      tax_amount:"0",
      total_amount:total,
      transaction_uuid:uuid,
      product_code:ESEWA_PRODUCT_CODE,
      product_service_charge:"0",
      product_delivery_charge:"0",
      success_url:`${SERVER_URL}/api/payments/esewa/success?orderId=${encodeURIComponent(orderId)}`,
      failure_url:`${SERVER_URL}/api/payments/esewa/failure?orderId=${encodeURIComponent(orderId)}`,
      signed_field_names:signedFieldNames,
      signature
    }
  });
});

app.get("/api/payments/esewa/success", async (req,res)=>{
  const orderId=req.query.orderId;
  const encoded=req.query.data;
  const order=orders.get(orderId);
  if(!order)return res.redirect(`${CLIENT_URL}/?payment=failed&reason=order-not-found`);

  try{
    if(!encoded)throw new Error("Missing eSewa response");
    const payload=JSON.parse(Buffer.from(encoded,"base64").toString("utf8"));

    if(payload.status!=="COMPLETE")throw new Error("Payment not complete");
    if(payload.product_code!==ESEWA_PRODUCT_CODE)throw new Error("Invalid product code");
    if(payload.transaction_uuid!==order.transactionUuid)throw new Error("Transaction mismatch");
    if(Number(payload.total_amount)!==Number(order.total))throw new Error("Amount mismatch");

    // Verify eSewa response signature using exactly the signed fields returned by eSewa.
    const names=String(payload.signed_field_names||"").split(",");
    const message=names.map(name=>`${name}=${payload[name]}`).join(",");
    const expected=sign(message);
    if(!payload.signature || payload.signature!==expected)throw new Error("Invalid eSewa signature");

    // Server-side transaction status verification.
    const url=new URL(ESEWA_STATUS_URL);
    url.searchParams.set("product_code",ESEWA_PRODUCT_CODE);
    url.searchParams.set("total_amount",String(order.total));
    url.searchParams.set("transaction_uuid",order.transactionUuid);
    const check=await fetch(url);
    const status=await check.json();
    if(!check.ok || status.status!=="COMPLETE")throw new Error("eSewa status verification failed");

    order.status="confirmed-paid";
    order.transactionCode=payload.transaction_code || status.ref_id || status.refId || "";
    orders.set(order.id,order);
    return res.redirect(`${CLIENT_URL}/?payment=success&orderId=${encodeURIComponent(order.id)}`);
  }catch(e){
    order.status="payment-verification-failed";
    orders.set(order.id,order);
    return res.redirect(`${CLIENT_URL}/?payment=failed&reason=${encodeURIComponent(e.message)}`);
  }
});

app.get("/api/payments/esewa/failure",(req,res)=>{
  const order=orders.get(req.query.orderId);
  if(order){order.status="payment-failed";orders.set(order.id,order);}
  res.redirect(`${CLIENT_URL}/?payment=failed`);
});

app.get("/api/orders/:id",(req,res)=>{
  const order=orders.get(req.params.id);
  if(!order)return res.status(404).json({ok:false,message:"Order not found"});
  res.json({ok:true,order});
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "../dist");

app.use(express.static(distPath));

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT,()=>console.log(`DOOR backend running on http://localhost:${PORT}`));