# DOOR Furniture Nepal — eSewa UAT Fixed

## Run
npm install
npm run dev

Open http://localhost:5173

## eSewa web test
The DOOR site redirects to the official eSewa EPAYTEST web page.
Use eSewa's test credentials on that page:
- eSewa ID: 9806800001 (also 0002/0003/0004/0005)
- Password: Nepal@123
- Verification token: 123456
- MPIN 1122 is for application/SDK testing, not the normal web ePay login.

After eSewa returns COMPLETE, the Express backend verifies the response and transaction status, marks the order confirmed, and redirects back to DOOR with the backend-generated random Order ID.

Important: do not use real eSewa credentials in UAT.
