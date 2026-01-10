if(process.env.NODE_ENV != "production"){
   require('dotenv').config();

}
console.log(process.env.SECRET);


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");     //paths set karasathi kontya file madhe ahhe vagere
const methodOverride = require("method-override");    // listings update karasathi
const ejsMate=require("ejs-mate");    //it is used for boilerplate

const dburl=process.env.ATLASDB_URL;





const ExpressError=require("./utils/ExpressError.js")
const listingRouter=require("./routes/listing.js")
const reviewsRouter=require("./routes/review.js")
const userRouter=require("./routes/user.js")

const session = require('express-session')  
const MongoStore = require('connect-mongo');

const flash=require('connect-flash')    //he te varte notification yete listing created ,deleted vajere
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js")





main()                            // he purna database connect karasathi
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
}

app.set("view engine", "ejs");     // it is required for template 
app.set("views", path.join(__dirname, "views"));   // aapn kontahi template create kela tar to views chya folder madhech search honar 
app.use(express.urlencoded({ extended: true }));   
app.use(methodOverride("_method"));   //override middle ware
app.engine('ejs',ejsMate);    //boilerplate 
app.use(express.static(path.join(__dirname,"/public")));  //styling 

// const store=MongoStore.create({
//   mongoUrl:dburl,
//   crypto:{
//     secret:process.env.SECRET
//   },
//   touchAfter:24*3600,
// });

// store.on("error",()=>{
//   console.log("ERROR in MONGO SESSION STORE",err);
// });
const sessionOptions={    
  // store,  
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized: true,
  cookie:{
     expires:Date.now() +7*24*60*60*1000,      // cookis kadhi vlaid rahtil
     maxAge:7*24*60*60*1000,
     httpOnly:true,  //security purpose
  }
}


// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });


app.use(session(sessionOptions));  //he session support la enable karte
app.use(flash());    //he flash la enable karte

app.use(passport.initialize());  // passport initialize karte
app.use(passport.session());  //pratyank request sathi login karalagnar nahi same session adhe 

passport.use(new LocalStrategy(User.authenticate()));//local la vaprta yeta ala pahije mhanun

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success=req.flash("success");   //local render karasathi used karte
  res.locals.error=req.flash("error");      
  res.locals.currUser=req.user;
  next();
  
})


// app.get("/demouser",async(req,res)=>{
//   let fakeuser=new User({
//       email:"nayan@gmail.com",
//       username:"delta-student",
//   })

//   let registeredUser=await User.register(fakeuser,"helloworld"); //it is used stored these infornation and password is helloworld this automatically checks that the useraname is unique or not
//   res.send(registeredUser);
// })

app.use("/listings",listingRouter);

app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);




app.all('/{*any}',(req,res,next)=>{
    next(new ExpressError(404,"PAGE NOT FOUND"));
});



app.use((err,req,res,next)=>{
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs",{err})
});



app.listen(8080, () => {
  console.log("server is listening to port 8080");
});