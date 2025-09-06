const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const axios = require("axios");   // ✅ Added axios to call Flask API
const app = express();

// ====== Middleware ======
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "mysecretkey", // use a strong secret in production
  resave: false,
  saveUninitialized: false
}));

// ====== MongoDB Setup ======
mongoose.connect("mongodb://127.0.0.1:27017/loginDemo", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ====== User Schema ======
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// ====== Routes ======

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Register Page
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    res.send("User already exists or error occurred.");
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } else {
    res.send("Invalid username or password");
  }
});

// Dashboard
app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  const user = await User.findById(req.session.userId);
  res.render("dashboard", { username: user.username });
});

// ===== Prediction Page =====
app.get("/prediction", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("prediction", { result: null });
});

// Handle Prediction Form
app.post("/prediction", async (req, res) => {
  try {
    const response = await axios.post("http://localhost:5000/predict", {
      Rainfall_mm: parseFloat(req.body.Rainfall_mm),
      Slope_Angle: parseFloat(req.body.Slope_Angle),
      Soil_Saturation: parseFloat(req.body.Soil_Saturation),
      Vegetation_Cover: parseFloat(req.body.Vegetation_Cover),
      Earthquake_Activity: parseFloat(req.body.Earthquake_Activity),
      Proximity_to_Water: parseFloat(req.body.Proximity_to_Water),
      Soil_Type_Gravel: parseInt(req.body.Soil_Type_Gravel),
      Soil_Type_Sand: parseInt(req.body.Soil_Type_Sand),
      Soil_Type_Silt: parseInt(req.body.Soil_Type_Silt)
    });

    res.render("prediction", { result: response.data });
  } catch (error) {
    console.error(error.message);
    res.render("prediction", { result: { error: "Prediction service unavailable" } });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ====== Start Server ======
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
