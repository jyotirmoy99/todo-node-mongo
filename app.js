const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//from .env
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
// const dbUrl = process.env.MONGO_URI;

require("dotenv").config();

//connect mongodb
mongoose
  .connect(
    "mongodb+srv://todo-admin:todo-admin123@cluster0.7sfe9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("DB CONNECTED!");
  });

//schema
const itemsSchema = {
  name: String,
};

//model
const Item = mongoose.model("Item", itemsSchema);

//mongoose documents
const item1 = new Item({
  name: "Welcome to your todolist.",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "Write something ...",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//GET ALL ITEMS
app.get("/", (req, res) => {
  //Mongoose find(), {} --> finds everything
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      // Mongoose insertMany()
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//DELETE ITEM
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed");
        res.redirect("/");
      }
    });
  } else {
    //Mongoose findOneAndUpdate()
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//SAVE ITEM
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//CUSTOM LIST
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  //Mongoose findOne()
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
