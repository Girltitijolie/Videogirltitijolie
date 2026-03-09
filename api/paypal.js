export default async function handler(req, res) {

const client = process.env.PAYPAL_CLIENT;
const secret = process.env.PAYPAL_SECRET;

if (!client || !secret) {
return res.status(500).json({
error:"missing_env",
message:"PayPal credentials missing"
});
}

const auth = Buffer.from(`${client}:${secret}`).toString("base64");

const response = await fetch(
"https://api-m.paypal.com/v1/oauth2/token",
{
method:"POST",
headers:{
Authorization:`Basic ${auth}`,
"Content-Type":"application/x-www-form-urlencoded"
},
body:"grant_type=client_credentials"
}
);

const data = await response.json();

res.status(200).json(data);

}
