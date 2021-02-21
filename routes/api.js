'use strict';
const {MongoClient} = require("mongodb");
const {ObjectID} = require('mongodb');
const client = MongoClient(process.env.DB);


module.exports = app => {
  const nond_arr = [undefined,"",NaN,null];
  const missing_id = {error:"missing _id"};

  app.route('/api/issues/:project')
    .post(function (req, res) {
      let project = req.params.project;
      const rb = req.body;
      if ([rb.issue_title,rb.issue_text,rb.created_by].includes(undefined)) {
        res.json({error: "required field(s) missing"});
      } else {
        client.connect((err, database) => {
          const db = database.db("fcc-issuetracker");
          db.collection(project).insertOne({
            issue_title: rb.issue_title,
            issue_text: rb.issue_text,
            created_by: rb.created_by,
            assigned_to: (rb.assigned_to!==undefined)?rb.assigned_to:"",
            status_text: (rb.status_text!==undefined)?rb.status_text:"",
            created_on: new Date().toISOString(),
            updated_on: new Date().toISOString(),
            open: true
          }, (err,obj) => {
            res.json(obj["ops"][0]);
          });
        });
      }
    })
    
    .get(function (req, res) {
      let project = req.params.project;
      client.connect((err, database) => {
        const db = database.db("fcc-issuetracker");
        let rq = req.query;
        if (rq["_id"] !== undefined) {
          try {
            rq["_id"] = new ObjectID(rq["_id"]);
          } catch {}
        }
        if (rq.open === "true") {rq.open = true;}
        else if (rq.open === "false") {rq.open = false;}
        db.collection(project).find(rq).toArray((err,result) => {
          res.send(result);
        });
      });
    })
    
    .put(function (req, res) {
      let project = req.params.project;
      const rb = Object.fromEntries(Object.entries(req.body).filter(kv=>kv[1]!=""));
      let id = rb["_id"];
      delete rb["_id"];
      if (nond_arr.includes(id)) {
        res.json(missing_id);
      } else if (Object.keys(rb).length == 0) {
        res.json({error:"no update field(s) sent",_id:id});
      } else {
        client.connect((err, database) => {
          const db = database.db("fcc-issuetracker");
          try {
            rb.updated_on = new Date().toISOString();
            if (rb.open === "false") {rb.open = false;}
            db.collection(project).updateOne(
              {_id:new ObjectID(id)}, 
              {$set: rb}, 
              (err,obj) => {
                if (obj.modifiedCount==0) {
                  res.json({error:"could not update","_id":id});
                } else {
                  res.json({result:"successfully updated","_id":id});
                }
              }
            );
          } catch {}
        });
      }
    })
    
    .delete(function (req, res) {
      let project = req.params.project;
      const rb = req.body;
      if (nond_arr.includes(rb["_id"])) {
        res.json(missing_id);
      } else {
        client.connect((err, database) => {
          const db = database.db("fcc-issuetracker");
          try {
            db.collection(project).deleteOne({_id:new ObjectID(rb["_id"])}, (err,obj) => {
              if (obj.deletedCount==0) {res.json({error:"could not delete","_id":rb["_id"]});}
              else {res.json({result:"successfully deleted","_id":rb["_id"]});}
            });
          } catch {}
        });
      }
    });
};