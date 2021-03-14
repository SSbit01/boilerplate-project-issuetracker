const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

//
const {ObjectID} = require('mongodb');
//

suite('Functional Tests', function() {
  suite("POST tests", () => {
    test("Create an issue with every field", done => {
      chai.request(server)
      .post("/api/issues/test")
      .send({
        issue_title: "test",
        issue_text: "text",
        created_by: "someone",
        assigned_to: "someone",
        status_text: "text"
      })
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.isDefined(res.body["_id"]);
        assert.equal(res.body.issue_title, "test");
        assert.equal(res.body.issue_text, "text");
        assert.equal(res.body.created_by, "someone");
        assert.equal(res.body.assigned_to, "someone");
        assert.equal(res.body.status_text, "text");
        assert.equal(res.body.open, true);
        let d = new Date().getTime();
        assert.approximately(new Date(res.body.created_on).getTime(), d, 7500);
        assert.approximately(new Date(res.body.updated_on).getTime(), d, 7500);
        done();
      });
    }).timeout(5000);

    test("Create an issue with only required fields", done => {
      chai.request(server)
      .post("/api/issues/test")
      .send({
        issue_title: "test123",
        issue_text: "text2",
        created_by: "q"
      })
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.isDefined(res.body["_id"]);
        assert.equal(res.body.issue_title, "test123");
        assert.equal(res.body.issue_text, "text2");
        assert.equal(res.body.created_by, "q");
        assert.equal(res.body.assigned_to, "");
        assert.equal(res.body.status_text, "");
        assert.equal(res.body.open, true);
        let d = new Date().getTime();
        assert.approximately(new Date(res.body.created_on).getTime(), d, 7500);
        assert.approximately(new Date(res.body.updated_on).getTime(), d, 7500);
        done();
      });
    });

    test("Create an issue with missing required fields", done => {
      chai.request(server)
      .post("/api/issues/test")
      .send({
        issue_title: "test123",
        issue_text: "text2"
      })
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, "required field(s) missing");
        done();
      });
    });
  });


  suite("GET tests", () => {
    test("View issues on a project", done => {
      chai.request(server)
      .get("/api/issues/test")
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 2);
        done();
      });
    });

    test("View issues on a project with one filter", done => {
      chai.request(server)
      .get("/api/issues/test")
      .query({issue_title: "test123"})
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        assert.equal(res.body[0].issue_title, "test123");
        done();
      });
    });

    test("View issues on a project with multiple filters", done => {
      chai.request(server)
      .get("/api/issues/test")
      .query({issue_title:"test123", issue_text:"text2"})
      .end((err,res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        assert.equal(res.body[0].issue_title, "test123");
        assert.equal(res.body[0].issue_text, "text2");
        done();
      });
    });
  });


  suite("PUT tests", () => {
    test("Update one field on an issue", done => {
      chai.request(server)
      .get("/api/issues/test")
      .end((err, arr) => {
        let id = arr.body[Math.floor(Math.random()*arr.body.length)]["_id"];
        let put_test = "put_test1";
        chai.request(server)
        .put("/api/issues/test")
        .send({_id:id, status_text:put_test})
        .end((err, res) => {
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body["_id"], id);
          chai.request(server)
          .get("/api/issues/test")
          .query({_id: id})
          .end((err, res) => {
            let obj = res.body[0];
            assert.equal(obj.status_text, put_test);
            assert.approximately(new Date(obj.updated_on).getTime(), new Date().getTime(), 7500);
            done();
          });
        });
      });
    }).timeout(5000);

    test("Update multiple fields on an issue", done => {
      chai.request(server)
      .get("/api/issues/test")
      .end((err, arr) => {
        let id = arr.body[Math.floor(Math.random()*arr.body.length)]["_id"];
        let put_test = "put_test2";
        let title = "title2";
        chai.request(server)
        .put("/api/issues/test")
        .send({_id:id, status_text:put_test, issue_title:title})
        .end((err, res) => {
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body["_id"], id);
          chai.request(server)
          .get("/api/issues/test")
          .query({_id: id})
          .end((err, res) => {
            let obj = res.body[0];
            assert.equal(obj.status_text, put_test);
            assert.equal(obj.issue_title, title);
            assert.approximately(new Date(obj.updated_on).getTime(), new Date().getTime(), 7500);
            done();
          });
        });
      });
    }).timeout(10000);

    test("Update an issue with missing _id", done => {
      chai.request(server)
      .put("/api/issues/test")
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
    });

    test("Update an issue with no fields to update", done => {
      chai.request(server)
      .put("/api/issues/test")
      .send({_id: "123456789012"})
      .end((err, res) => {
        assert.equal(res.body.error, "no update field(s) sent");
        done();
      });
    });

    test("Update an issue with an invalid _id", done => {
      chai.request(server)
      .put("/api/issues/test")
      .send({_id:"123456789012", issue_title:"test"})
      .end((err, res) => {
        assert.equal(res.body.error, "could not update");
        done();
      });
    });
  });


  suite("DELETE tests", () => {
    test("Delete an issue", done => {
      chai.request(server)
      .get("/api/issues/test")
      .end((err, arr) => {
        let id = arr.body[Math.floor(Math.random()*arr.body.length)]["_id"];
        chai.request(server)
        .delete("/api/issues/test")
        .send({_id:id})
        .end((err, res) => {
          assert.equal(res.body.result, "successfully deleted");
          assert.equal(res.body["_id"], id);
          chai.request(server)
          .get("/api/issues/test")
          .query({_id: id})
          .end((err, res) => {
            let obj = res.body;
            assert.equal(obj.length, 0);
            done();
          });
        });
      });
    }).timeout(5000);

    test("Delete an issue with an invalid _id", done => {
      chai.request(server)
      .delete("/api/issues/test")
      .send({_id: "123456789012"})
      .end((err, res) => {
        assert.equal(res.body.error, "could not delete");
        done();
      });
    });

    test("Delete an issue with missing _id", done => {
      chai.request(server)
      .delete("/api/issues/test")
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
    });
  });
});
