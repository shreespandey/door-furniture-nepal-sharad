import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, ShoppingBag, UserRound, Menu, X, ChevronRight,
  Plus, Minus, Truck, ShieldCheck, RotateCcw, ArrowRight,
  CheckCircle2, MapPin
} from "lucide-react";
import "./styles.css";

import { PRODUCTS } from "./products.js";

const CATEGORIES = [
  ["Sofas","https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=900&q=85"],
  ["Beds","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85"],
  ["Dining","https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=85"],
  ["Office","https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85"]
];

const rs = n => `Rs. ${n.toLocaleString("en-IN")}`;

function App(){
  const [page,setPage] = useState("home");
  const [cart,setCart] = useState([]);
  const [drawer,setDrawer] = useState(false);
  const [menu,setMenu] = useState(false);
  const [filter,setFilter] = useState("All");
  const [selected,setSelected] = useState(null);
  const [payment,setPayment] = useState("cod");
  const [order,setOrder] = useState(()=>{
    const q=new URLSearchParams(window.location.search);
    return q.get("payment")==="success" ? q.get("orderId") : null;
  });
  const paymentFromUrl = new URLSearchParams(window.location.search).get("payment");
  React.useEffect(()=>{
    if(paymentFromUrl==="success") setPayment("esewa");
  },[]);

  const count = cart.reduce((s,i)=>s+i.qty,0);
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const delivery = subtotal === 0 ? 0 : subtotal >= 50000 ? 0 : 500;
  const total = subtotal + delivery;

  const add = (p, open=true) => {
    setCart(c => {
      const found=c.find(x=>x.id===p.id);
      return found ? c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x) : [...c,{...p,qty:1}];
    });
    if(open) setDrawer(true);
  };
  const changeQty=(id,d)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:x.qty+d}:x).filter(x=>x.qty>0));
  const go=(p)=>{setPage(p);window.scrollTo(0,0);setMenu(false)};
  const openProduct=p=>{setSelected(p);go("product")};

  if(order) return <Success order={order} payment={payment} onHome={()=>location.reload()}/>;
  if(page==="checkout") return <Checkout cart={cart} subtotal={subtotal} delivery={delivery} total={total} payment={payment} setPayment={setPayment} back={()=>go("cart")} submit={(id)=>setOrder(id)}/>;
  if(page==="cart") return <CartPage cart={cart} subtotal={subtotal} delivery={delivery} total={total} changeQty={changeQty} back={()=>go("shop")} checkout={()=>go("checkout")}/>;

  return <>
    <div className="announcement">FREE DELIVERY ON ORDERS ABOVE RS. 50,000 &nbsp; • &nbsp; DELIVERY ACROSS NEPAL</div>
    <nav className="nav">
      <button className="mobileBtn" onClick={()=>setMenu(!menu)}><Menu/></button>
      <button className="brand" onClick={()=>go("home")}>DOOR<span>.</span></button>
      <div className={"navLinks "+(menu?"show":"")}>
        <button onClick={()=>go("home")}>HOME</button>
        <button onClick={()=>go("shop")}>SHOP</button>
        <button onClick={()=>{go("home");setTimeout(()=>document.getElementById("rooms")?.scrollIntoView(),20)}}>ROOMS</button>
        <button onClick={()=>{go("home");setTimeout(()=>document.getElementById("about")?.scrollIntoView(),20)}}>ABOUT</button>
      </div>
      <div className="navActions">
        <Search/>
        <UserRound className="hidePhone"/>
        <button className="cartIcon" onClick={()=>setDrawer(true)}><ShoppingBag/><b>{count}</b></button>
      </div>
    </nav>

    {page==="home" && <Home goShop={()=>go("shop")} openProduct={openProduct} add={add}/>}
    {page==="shop" && <Shop filter={filter} setFilter={setFilter} openProduct={openProduct} add={add}/>}
    {page==="product" && selected && <Product product={selected} add={add} goShop={()=>go("shop")}/>}

    <Footer goShop={()=>go("shop")}/>

    {drawer && <CartDrawer cart={cart} subtotal={subtotal} changeQty={changeQty} close={()=>setDrawer(false)} viewCart={()=>{setDrawer(false);go("cart")}} checkout={()=>{setDrawer(false);go("checkout")}}/>}
  </>;
}

function Home({goShop,openProduct,add}){
 return <>
  <section className="hero">
    <div className="heroCopy">
      <p className="eyebrow light">NEW COLLECTION 2026</p>
      <h1>Make room<br/>for <em>living.</em></h1>
      <p className="heroDesc">Modern furniture made for real Nepali homes. Comfortable, beautiful and delivered right to your door.</p>
      <button className="btn light" onClick={goShop}>SHOP NOW <ArrowRight size={18}/></button>
    </div>
  </section>

  <section className="features">
    <div><Truck/><span><b>Delivery across Nepal</b><small>Fast & careful delivery</small></span></div>
    <div><ShieldCheck/><span><b>Quality you can trust</b><small>Selected durable materials</small></span></div>
    <div><RotateCcw/><span><b>Easy support</b><small>We're here after purchase</small></span></div>
  </section>

  <section className="wrap categories" id="rooms">
    <div className="heading"><div><p className="eyebrow">SHOP BY ROOM</p><h2>Find your piece.</h2></div><button className="textBtn" onClick={goShop}>VIEW ALL <ChevronRight/></button></div>
    <div className="categoryGrid">
      {CATEGORIES.map(([n,img])=><button key={n} className="category" onClick={goShop}><img src={img}/><span>{n}<ArrowRight/></span></button>)}
    </div>
  </section>

  <section className="wrap productsSec">
    <div className="heading"><div><p className="eyebrow">TRENDING NOW</p><h2>Made to be lived in.</h2></div><button className="textBtn" onClick={goShop}>SHOP ALL <ChevronRight/></button></div>
    <ProductGrid products={PRODUCTS.slice(0,4)} openProduct={openProduct} add={add}/>
  </section>

  <section className="story" id="about">
    <div className="storyImage"></div>
    <div className="storyCopy"><p className="eyebrow">THIS IS DOOR</p><h2>Good furniture.<br/>No complications.</h2><p>We created DOOR for people who want their home to feel better without making furniture shopping difficult. Simple designs, practical comfort, transparent pricing and delivery around Nepal.</p><button className="btn dark" onClick={goShop}>EXPLORE DOOR <ArrowRight size={18}/></button></div>
  </section>

  <section className="newsletter"><p className="eyebrow">DOOR COMMUNITY</p><h2>Come home to something better.</h2><p>New pieces, offers and home inspiration.</p><div><input placeholder="Your email address"/><button>JOIN US</button></div></section>
 </>;
}

function Shop({filter,setFilter,openProduct,add}){
 const cats=["All","Sofa","Chair","Bed","Table","Dining","Storage","Office"];
 const shown=filter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.category===filter);
 return <main className="wrap shopPage">
   <p className="eyebrow">DOOR COLLECTION</p><h1>Furniture</h1><p className="intro">Designed for everyday living. Shop our collection for homes across Nepal.</p>
   <div className="filters">{cats.map(c=><button className={filter===c?"active":""} onClick={()=>setFilter(c)} key={c}>{c}</button>)}</div>
   <ProductGrid products={shown} openProduct={openProduct} add={add}/>
 </main>
}

function ProductGrid({products,openProduct,add}){
 return <div className="productGrid">{products.map(p=><article className="productCard" key={p.id}>
   <button className="productImage" onClick={()=>openProduct(p)}><img src={p.image}/>{p.tag&&<span className="tag">{p.tag}</span>}<span className="quick" onClick={e=>{e.stopPropagation();add(p)}}><Plus/> ADD</span></button>
   <button className="productInfo" onClick={()=>openProduct(p)}><small>{p.category.toUpperCase()}</small><h3>{p.name}</h3><p>{rs(p.price)} {p.old&&<del>{rs(p.old)}</del>}</p></button>
 </article>)}</div>
}

function Product({product,add,goShop}){
 return <main className="wrap productPage">
   <button className="backLink" onClick={goShop}>← Back to shop</button>
   <div className="productLayout">
    <div className="detailImage"><img src={product.image}/>{product.tag&&<span className="tag">{product.tag}</span>}</div>
    <div className="detailCopy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><div className="detailPrice">{rs(product.price)} {product.old&&<del>{rs(product.old)}</del>}</div><p className="detailText">A clean, comfortable piece designed for modern homes. Built with everyday use in mind and selected to fit beautifully into Nepali living spaces.</p>
    <div className="stock">● In stock — ready for delivery</div>
    <button className="btn dark full" onClick={()=>add(product)}>ADD TO CART <ShoppingBag size={18}/></button>
    <div className="detailBenefits"><span><Truck/> Delivery across Nepal</span><span><ShieldCheck/> Quality checked</span><span><MapPin/> Kathmandu & nationwide service</span></div>
    </div>
   </div>
 </main>
}

function CartDrawer({cart,subtotal,changeQty,close,viewCart,checkout}){
 return <><div className="shade" onClick={close}></div><aside className="drawer">
  <div className="drawerTitle"><h2>Shopping Bag <span>({cart.reduce((s,x)=>s+x.qty,0)})</span></h2><button onClick={close}><X/></button></div>
  {!cart.length?<div className="empty"><ShoppingBag/><h3>Your bag is empty.</h3><p>Find something for your home.</p></div>:<>
    <div className="drawerItems">{cart.map(i=><CartItem key={i.id} i={i} changeQty={changeQty}/>)}</div>
    <div className="drawerBottom"><div><span>SUBTOTAL</span><b>{rs(subtotal)}</b></div><small>Shipping calculated at checkout</small><button className="btn dark full" onClick={checkout}>CHECKOUT <ArrowRight/></button><button className="outline full" onClick={viewCart}>VIEW BAG</button></div>
  </>}
 </aside></>
}

function CartItem({i,changeQty}){
 return <div className="cartItem"><img src={i.image}/><div className="cartItemInfo"><h4>{i.name}</h4><p>{rs(i.price)}</p><div className="qty"><button onClick={()=>changeQty(i.id,-1)}><Minus/></button><span>{i.qty}</span><button onClick={()=>changeQty(i.id,1)}><Plus/></button></div></div></div>
}

function CartPage({cart,subtotal,delivery,total,changeQty,back,checkout}){
 return <main className="wrap cartPage"><button className="backLink" onClick={back}>← Continue shopping</button><h1>Your Bag</h1>
 <div className="cartLayout"><section>{!cart.length?<p>Your bag is empty.</p>:cart.map(i=><CartItem key={i.id} i={i} changeQty={changeQty}/>)}</section>
 <aside className="orderBox"><h2>Order Summary</h2><p><span>Subtotal</span><b>{rs(subtotal)}</b></p><p><span>Delivery</span><b>{delivery?rs(delivery):"FREE"}</b></p><hr/><p className="total"><span>Total</span><b>{rs(total)}</b></p><button disabled={!cart.length} className="btn dark full" onClick={checkout}>GO TO CHECKOUT <ArrowRight/></button></aside></div></main>
}

function Checkout({cart,subtotal,delivery,total,payment,setPayment,back,submit}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [form,setForm]=useState({name:"",phone:"",city:"",province:"Bagmati",address:""});
 const valid=form.name&&form.phone&&form.city&&form.address&&cart.length;

 const createOrder=async()=>{
   const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     customer:form,items:cart.map(({id,name,price,qty})=>({id,name,price,qty})),
     subtotal,delivery,total,paymentMethod:payment
   })});
   const data=await r.json();
   if(!r.ok)throw new Error(data.message||"Could not create order");
   return data.orderId;
 };

 const submitEsewaForm=(action,fields)=>{
   const formEl=document.createElement("form");
   formEl.method="POST"; formEl.action=action;
   Object.entries(fields).forEach(([name,value])=>{
     const input=document.createElement("input");
     input.type="hidden"; input.name=name; input.value=value;
     formEl.appendChild(input);
   });
   document.body.appendChild(formEl);
   formEl.submit();
 };

 const finish=async()=>{
   if(!valid||busy)return;
   setBusy(true);setError("");
   try{
     const orderId=await createOrder();
     if(payment==="cod"){
       const r=await fetch(`/api/orders/${orderId}/cod`,{method:"POST"});
       if(!r.ok)throw new Error("Could not confirm COD order");
       submit(orderId);
       return;
     }
     const r=await fetch("/api/payments/esewa/initiate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId})});
     const data=await r.json();
     if(!r.ok)throw new Error(data.message||"Could not start eSewa");
     submitEsewaForm(data.action,data.fields);
   }catch(e){setError(e.message);setBusy(false)}
 };

 return <main className="checkoutPage">
  <div className="checkoutNav"><button className="brand" onClick={back}>DOOR<span>.</span></button><span>SECURE CHECKOUT</span></div>
  <div className="checkoutLayout">
   <section className="checkoutForm"><button className="backLink" onClick={back}>← Back to bag</button><h1>Checkout</h1>
    <h3>Delivery information</h3>
    <div className="formGrid">
      <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
      <input placeholder="City / District" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/>
      <select value={form.province} onChange={e=>setForm({...form,province:e.target.value})}><option>Bagmati</option><option>Koshi</option><option>Madhesh</option><option>Gandaki</option><option>Lumbini</option><option>Karnali</option><option>Sudurpashchim</option></select>
      <textarea placeholder="Full delivery address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
    </div>
    <h3>Payment</h3>
    <button className={"paymentChoice "+(payment==="cod"?"selected":"")} onClick={()=>setPayment("cod")}><span className="radio">{payment==="cod"&&"●"}</span><div><b>Cash on Delivery</b><small>Pay when your order arrives.</small></div></button>
    <button className={"paymentChoice "+(payment==="esewa"?"selected":"")} onClick={()=>setPayment("esewa")}><span className="radio">{payment==="esewa"&&"●"}</span><div><b className="esewa">eSewa — UAT Test Payment</b><small>Redirects to eSewa's official test checkout (EPAYTEST).</small></div></button>
    {payment==="esewa"&&<div className="esewaDemo">
      <b>eSewa TEST MODE</b>
      <p className="warning">You will be redirected to eSewa's official EPAYTEST page. Enter the test login on eSewa's page — not on DOOR.</p>
      <div style={{fontSize:11,lineHeight:1.8,marginTop:10}}>
        <b>Test eSewa ID:</b> 9806800001 <span style={{color:"#777"}}>(or ...0002 / ...0003 / ...0004 / ...0005)</span><br/>
        <b>Password:</b> Nepal@123<br/>
        <b>Verification token:</b> 123456<br/>
        <span style={{color:"#777"}}>MPIN 1122 is for app/SDK testing; the web ePay page uses ID + password, then the test verification token.</span>
      </div>
    </div>}
    {error&&<p style={{color:"#a22",fontSize:11}}>{error}</p>}
   </section>
   <aside className="checkoutSummary"><h2>Your order</h2>{cart.map(i=><div className="miniItem" key={i.id}><div><img src={i.image}/><i>{i.qty}</i></div><span>{i.name}</span><b>{rs(i.price*i.qty)}</b></div>)}<hr/><p><span>Subtotal</span><b>{rs(subtotal)}</b></p><p><span>Delivery</span><b>{delivery?rs(delivery):"FREE"}</b></p><div className="checkoutTotal"><span>Total</span><b>{rs(total)}</b></div><button className="btn dark full" disabled={!valid||busy} onClick={finish}>{busy?"PLEASE WAIT...":payment==="esewa"?"PAY WITH ESEWA TEST":"CONFIRM COD ORDER"} <ArrowRight/></button></aside>
  </div>
 </main>
}
function Success({order,payment,onHome}){
 return <div className="success">
   <div className="successIcon"><CheckCircle2/></div>
   <p className="eyebrow">ORDER CONFIRMED</p>
   <h1>Your order is<br/>confirmed.</h1>
   <p>Thank you for shopping at DOOR Furniture Nepal.</p>
   <div className="successNote">
     <strong>ORDER ID</strong><br/>
     <span style={{fontSize:22,fontWeight:700,letterSpacing:1}}>{order}</span>
     <hr style={{border:0,borderTop:"1px solid #d3cec4",margin:"14px 0"}}/>
     {payment==="esewa"
       ?"Demo eSewa payment successful. This was a test transaction; no real money was charged."
       :"Cash on Delivery order confirmed. Pay when your furniture arrives."}
   </div>
   <p style={{fontSize:11,color:"#777"}}>Please save your Order ID for reference.</p>
   <button className="btn dark" onClick={onHome}>CONTINUE SHOPPING</button>
 </div>
}

function Footer({goShop}){
 return <footer><div><button className="brand footerBrand">DOOR<span>.</span></button><p>Furniture for everyday Nepal.</p></div><div><b>SHOP</b><button onClick={goShop}>All Furniture</button><button onClick={goShop}>Sofas</button><button onClick={goShop}>Beds</button></div><div><b>HELP</b><span>Delivery across Nepal</span><span>Cash on Delivery</span><span>Customer Support</span></div><div className="footerBottom">© 2026 DOOR Furniture Nepal</div></footer>
}

createRoot(document.getElementById("root")).render(<App/>);
