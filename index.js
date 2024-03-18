const express = require('express');
const path = require('path');
const app = express();
const ejs = require("ejs");
const expresslayouts = require("express-ejs-layouts");
const MongoClient = require("mongodb").MongoClient;
const fileupload = require("express-fileupload");


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views/"))
app.set("layout","layouts/mainlayouts")
app.use(expresslayouts);
app.use(fileupload());
app.use(express.static(__dirname+"/public"))
app.use(express.urlencoded({extended: false}));



var url = "mongodb://localhost:27017/fruit_shop";
var admin_detail_collection;
var customer_registration_collection;
var fruit_detail_collection;
MongoClient.connect(url,function(err,client){
    if(err) throw err;
    const db = client.db("fruit_shop");

    admin_detail_collection = db.collection("admin_detail");
    customer_registration_collection = db.collection("customer_registration");    
    fruit_detail_collection = db.collection("fruits_detail");    
    console.log("Database Connected Successfully");
})



app.get("/",function(req,res){
    res.render("default/home")
})

app.get("/about",function(req,res){
    res.render("default/about")
})

app.get("/contact",function(req,res){
    res.render("default/contact")
})

app.get("/registration",function(req,res){
    res.render("default/registration")
})


app.post("/add_customer",function(req,res){
    const {txtname,txtadd,txtcity,txtmno,txtemail,txtpwd} = req.body;
    customer_registration_collection.findOne({email_id: txtemail},function(err,result){
        if(err) throw err;
        if(result == null)
        {
            customer_registration_collection.find().sort({customer_id: -1}).limit(1).toArray(function(err2,result2){
                if(err2) throw err2;
                let custid=0;
                if(result2.length == 0)
                {
                    custid = 1;
                }
                else
                {
                    var row = JSON.parse(JSON.stringify(result2[0]));
                    custid = row.customer_id + 1;
                }
                customer_registration_collection.insertOne({customer_id: custid,customer_name: txtname,address: txtadd,city: txtcity,mobile_no: txtmno,email_id: txtemail,pwd: txtpwd},function(err3,result3){
                    if(err3) throw err3;
                    res.write("<script> alert('Register Successfully'); window.location.href='/login'; </script>");                    
                })
            })
        }else{
            res.write("<script> alert('Email Id Already Exists'); window.location.href='/registration'; </script>");            
        }
    })
})


app.get("/login",function(req,res){
    res.render("default/login")
})


app.post("/log_user",function(req,res){
    const {txtemail,txtpwd}  =req.body;

    admin_detail_collection.findOne({email_id: txtemail,pwd: txtpwd},function(err,result){
        if(err) throw err;
        if(result == null)        
        {
            customer_registration_collection.findOne({email_id: txtemail,pwd: txtpwd},function(err2,result2){
                if(err2) throw err2;
                if(result2 == null)        
                {
                    res.write("<script> alert('Invalid Email Id Or Password'); window.location.href='/login'; </script>");
                }
                else
                {
                    res.write("<script> alert('Customer Login Successfully'); window.location.href='/login'; </script>");
                }
            })
        }
        else
        {
            res.write("<script> alert('Admin Login Successfully'); window.location.href='/admin_manage_fruits'; </script>");
        }
    })
})


app.get("/logout",function(req,res){
    res.redirect("/")
})

app.get("/admin_manage_fruits",function(req,res){
    fruit_detail_collection.find().toArray(function(err,result){
        res.render("admin/admin_manage_fruits",{layout: "layouts/adminlayouts",fitems: result});
    })
    
})


app.post("/add_fruit",function(req,res){
    const {txtname,txtdesc,seluom,txtprice} = req.body;
    if(!req.files || Object.keys(req.files).length == 0)
    {
        res.write("<script> alert('Please Select Fruit Image'); window.location.href='/admin_manage_fruits'; </script>");
    }else{
        let samplefile = req.files.txtimg;
        let tmp_path = "/fruit_img/" + Date.now() + ".jpg";
        let upload_path = __dirname + "/public" + tmp_path;
        fruit_detail_collection.find().sort({fruit_id: -1}).limit(1).toArray(function(err2,result2){
            if(err2) throw err2;
            let fid=0;
            if(result2.length == 0)
            {
                fid = 1;
            }
            else
            {
                var row = JSON.parse(JSON.stringify(result2[0]));
                fid = row.fruit_id + 1;
            }
            fruit_detail_collection.insertOne({fruit_id: fid,fruit_name: txtname,description: txtdesc,uom: seluom,price: parseInt(txtprice),fruit_img: tmp_path},function(err3,result3){
                if(err3) throw err3;
                samplefile.mv(upload_path,function(err4,result4){
                    if(err4)
                    {
                        res.write("<script> alert('Error In Uploading'); window.location.href='/admin_manage_fruits'; </script>");                        
                    }
                    else
                    {
                        res.write("<script> alert('Fruit Detail Saved Successfully'); window.location.href='/admin_manage_fruits'; </script>");
                    }
                })
            })
        })
    }
});


app.get("/edit_fruit/:fid",function(req,res){
    let fruitid = parseInt(req.params.fid);
    fruit_detail_collection.find({fruit_id:fruitid}).toArray(function(err,result){
        res.render("admin/admin_update_fruits",{layout: "layouts/adminlayouts",fitems: result});
    })
})


app.post("/update_fruit",function(req,res){
    const {txtfid,txtname,txtdesc,seluom,txtprice} = req.body;
    if(!req.files || Object.keys(req.files).length == 0)
    {
        fruit_detail_collection.updateOne({fruit_id: parseInt(txtfid)},{$set: {fruit_name: txtname,description: txtdesc,uom: seluom,price: parseInt(txtprice)}},function(err,result){
            if(err) throw err;
            res.write("<script> alert('Fruit Detail Updated Successfully'); window.location.href='/admin_manage_fruits'; </script>");            
        })
    }else{
        let samplefile = req.files.txtimg;
        let tmp_path = "/fruit_img/" + Date.now() + ".jpg";
        let upload_path = __dirname + "/public" + tmp_path;
        fruit_detail_collection.updateOne({fruit_id: parseInt(txtfid)},{$set: {fruit_name: txtname,description: txtdesc,uom: seluom,price: parseInt(txtprice),fruit_img: tmp_path}},function(err,result){
            if(err) throw err;
            samplefile.mv(upload_path,function(err4,result4){
                if(err4)
                {
                    res.write("<script> alert('Error In Uploading'); window.location.href='/admin_manage_fruits'; </script>");                        
                }
                else
                {
                    res.write("<script> alert('Fruit Detail Updated Successfully'); window.location.href='/admin_manage_fruits'; </script>");
                }
            })
        })
    }
})


app.get("/delete_fruit/:fid",function(req,res){
    let fruitid = parseInt(req.params.fid);
    fruit_detail_collection.remove({fruit_id: fruitid},function(err,result){
        if(err) throw err;
        res.write("<script> alert('Fruit Detail Deleted Successfully'); window.location.href='/admin_manage_fruits'; </script>");        
    })
})
app.listen(3000,function(){
    console.log("Server Started At Port No: 3000. Click Here http://127.0.0.1:3000/ To Open Website");
})