Fashion Store: Backend API
Node.js and Express API for a full stack e-commerce store: authentication, products, cart, orders, Stripe payments with webhooks, and an AI shopping agent with a human approval step.

Frontend repo: link to your frontend repo

Features
JWT authentication stored in an httpOnly cookie, and Google OAuth sign-in
Products: list, filter by category and price, pagination, product details
Image upload for products (Multer and Cloudinary)
Cart and orders, with user identity always taken from the token
Stripe PaymentIntents and a webhook that marks orders as paid or failed
Admin routes: add and delete products, discount coupons, mark orders as shipped, view all orders
Email notification when an order ships (queue and mailer)
Redis for pending AI actions and the job queue
AI shopping agent (LangChain with Groq) with tools for product search, order status and cart management
Tech stack
Node.js, Express, MongoDB with Mongoose, Redis, Stripe, Passport (Google OAuth 2.0), JSON Web Tokens, bcrypt, LangChain, Groq, Zod, Multer, Cloudinary, Nodemailer

Getting started
1. Install
bash
git clone https://github.com/YOUR-USERNAME/YOUR-BACKEND-REPO.git
cd YOUR-BACKEND-REPO
npm install
2. Environment variables
Create a .env file (see .env.example). Use the exact names your code reads:

PORT=3000
mongo=mongodb+srv://...
JWT_SECRET=a_long_random_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
stripe_webhook_secret=whsec_xxxxxxxxxxxx

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK=http://localhost:3000/link/auth/google/callback

# AI
GROQ_API_KEY=

# Cloudinary, Redis, email
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
EMAIL_USER=
EMAIL_PASS=
Never commit .env. It is listed in .gitignore.

3. Run
bash
node server.js
The API runs on http://localhost:3000, and all routes are under /link.

4. Stripe webhook (local)
Install the Stripe CLI, then:

bash
stripe login
stripe listen --forward-to localhost:3000/paynow
Copy the whsec_... secret it prints into stripe_webhook_secret and restart the server.

5. Google OAuth
In Google Cloud Console, add this authorized redirect URI:

http://localhost:3000/link/auth/google/callback
API overview
All routes are prefixed with /link.

Method	Route	Description	Auth
POST	/sign	Sign up	
POST	/login	Log in	
POST	/logout	Log out	
GET	/me	Current user	Yes
GET	/auth/googlesign	Start Google sign-in	
GET	/auth/google/callback	Google callback	
GET	/products	List products	
GET	/category	Filter by type and price	
GET	/skip	Pagination	
GET	/new	New arrivals	
GET	/prdetail/:id	Product details	
POST	/addcart	Add to cart	Yes
GET	/allcart	View cart	Yes
POST	/edit	Edit cart item	Yes
DELETE	/delcart	Remove from cart	Yes
POST	/addorder	Create order	Yes
GET	/myorders	My orders, with ?status= and ?payment=	Yes
POST	/payment/create	Create Stripe PaymentIntent	Yes
POST	/aicalling	Talk to the AI agent	Yes
POST	/aiconfirm	Confirm or cancel an AI action	Yes
POST	/add	Add product (image upload)	Admin
DELETE	/delete	Delete product	Admin
POST	/discount	Create coupon	Admin
PUT	/admin/ship	Mark order shipped and send email	Admin
GET	/orders/admin	All orders	Admin
The Stripe webhook is a separate route: POST /paynow.

Security notes
The user ID always comes from the verified JWT, never from the request body or the AI prompt.
Order totals are calculated on the server from database prices.
Stripe webhooks are verified with the signing secret.
Passwords are hashed with bcrypt.
The AI agent runs every tool with the logged-in user's ID, so a user can only reach their own data.
The AI agent and human approval
Read-only tools (product search, order status, view cart) run immediately. Tools that change data (remove or edit a cart item, place an order) do not run directly:

The tool saves the requested action in Redis with a unique ID and a short expiry.
The API returns a confirmation request to the frontend.
The user clicks Yes or No, which calls POST /aiconfirm.
Only on Yes does the server run the saved action. It runs once, and only for the same user.
The arguments are stored on the server, so neither the user nor the model can change them after the request.

Author
Ali Cheema. Open to freelance work. LinkedIn


