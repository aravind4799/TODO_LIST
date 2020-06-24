//jshint esversion:6

var flag=1
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//to silent deprecation warnings
mongoose.set('useFindAndModify',false);

//create a mongodb database named todolistDB
//mongodb+srv://admin_aravind:<password>@cluster0-e7ve9.mongodb.net/<dbname>?retryWrites=true&w=majority
mongoose.connect("mongodb+srv://admin_aravind:battlebee4799@cluster0-e7ve9.mongodb.net/todolistDB",{ useNewUrlParser: true, useUnifiedTopology: true })

//create a schema for home route
const ListSchema = {
  name: String
}

//schema for handling dynamic routes
const DynamicSchema = {
  route_name:String,
  list: [ListSchema]
}

//create a collection named todolist in todolistDB
const todolist = mongoose.model("todolist",ListSchema);

//creates a collecion named dynamic_todolist in todolistDB
const dynamic_list = mongoose.model("dynamic_todolist",DynamicSchema);

//creates document in collection todolist in todolistDB
const item1 = todolist({
  name: "Welcome to todolist app",
});

const item2 =todolist({
  name: "press + to add items"
});

const item3 = todolist({
  name: "<-- to remove finished items"
});

const defaultlist = [item1,item2,item3]

app.get("/", function(req, res) {
  const day = date.getDate();
  todolist.find(function(err,data_found){
    //console.log(flag);
    if(data_found.length===0 && flag === 1 ){
      todolist.insertMany(defaultlist,function(err){
        if(!err){
          flag=0
          res.redirect("/")
        }
      })
    }
    else{
      res.render("list",{date:day,listTitle:"Home",newListItems:data_found})
    }
  })
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const route = _.capitalize(req.body.list)
  const new_item = todolist({
    name:item
  });
  if(route==="Home"){
  //to create a document of user given item and need to update the collection
  //save() to just insert one document into todolists collection
  new_item.save()
  res.redirect("/")
}
else
{
  dynamic_list.findOne({route_name:route},function(err,found_data){
    //console.log(found_data);
    // add the item to existing list
    found_data.list.push(new_item)
    found_data.save()
    res.redirect("/"+ route)
  })
}
});

//to delete item from database when a checkbox is clicked
app.post("/delete",function(req,res){
  const id = req.body.checkbox
  const list = _.capitalize(req.body.list)

  if(list === "Home"){
  todolist.findByIdAndRemove(id,function(err){
    if(!err){
      //console.log("successfully deleted from home list");
      res.redirect("/")
    }
  })
}
else
{
  dynamic_list.findOneAndUpdate({route_name:list} , {$pull:{list:{_id:id}}}, {useFindAndModify: false},function(err,foundlist){
    if(!err){
      //console.log(foundlist);
      //console.log("deleted from dynamic list");
      res.redirect("/"+ list)
    }
  })
}

})
//handling dynamic routes
//creating dynamic collecions
app.get("/:dynamic_route",function(req,res){
  const day = date.getDate();
  const route = _.capitalize(req.params.dynamic_route)
  if(route === "Home"){
    res.redirect("/")
  }
  else
  {
  dynamic_list.find({route_name:route},function(err,data_got){
    //console.log(data_got);
    //data_got is an array of javascript objects..it finds all matching the filter
    //console.log(data_got.length);
    if(data_got.length === 0){
      const default_data = dynamic_list({
        route_name:route,
        list:defaultlist
      });
      default_data.save()
      res.redirect("/" + route)
    }
    else{
      res.render("list",{date:day,listTitle:route,newListItems:data_got[0].list})
    }
  })
}
})

app.listen( process.env.PORT || 3040, function() {
  console.log("Server started on port 3040");
});
