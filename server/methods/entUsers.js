import Users from '/server/pr-schema/models/users';
import { schemaValidate } from '/server/pr-schema/validate';

Meteor.methods({
  'users.role': (userName) => {
    return Users.findOne({'username':userName},{fields:{'role':1}}).role;
  },
  'user.getid':(userName) => {
  	return Users.findOne({'username':userName}, {fields:{'_id':1}})._id;
  },
  'tester.get':()=>{
  	return Users.find({'role':9},{fields:{'_id':1,'name':1}}).fetch();
  },
  'agent.get':()=>{
    return Users.find({'role':6},{fields:{'_id':1,'name':1}}).fetch();
  },
  'agent.adduser.get': ( page, perpage, field, order) => {
  	const skiped = ( parseInt(page) - 1 ) * parseInt(perpage);
  	const orderid = order == 'ASC' ? 'asc':'desc';
    return Users.find({},{fields:{"username":1,"role":1,"password":1},skip:parseInt(skiped), limit:parseInt(perpage), sort:[[ field, orderid ]]}).fetch();
  },
  'agent.adduser.getOne': ( id) => {
     return Users.findOne({'_id':id}, {fields:{"username":1,"role":1,"password":1}});

  },
   'agent.adduser.updateData': ( id,data) => {
    const{password,role,username}=data;
     return Users.update({'_id':id}, { $set:{'role':role}});

  },
  'agent.adduser.createUser': ( data) => {
    const{password,role,username,phone}=data;
    console.log(data);
    const nowDate = new Date();
    const user = {
      phone: phone,
      username: username,
      password: password,
      role: role,
      createdAt: nowDate / 1,
    };
    const res = schemaValidate('userSchema', user);
    if(res){
      return null;
    }
    const userId = Accounts.createUser(user);
    return Users.findOne({'_id':userId});
  },
  'agent.adduser.checkUsername': ( username) => {
    var x=Users.findOne({'username':username});

    if(typeof x == "undefined")
      return false;
    else
      return true;
  },
  'checkPassword':(userName,password)=>{
    const user = Users.findOne({'username':userName});
    const rel = Accounts._checkPassword(user, password);
    if(rel.error){
      return false;
    }else{
      return true;
    }
  },
  'changePWD':(userName, password)=>{
    const userId = Users.findOne({'username':userName});
    if (!userId) {
      return false;
    }
    Accounts.setPassword(userId,password);
    Users.update({'_id':userId._id},{ $set:{'isPasswordReseted':true}});
    return true;
  },
  'checkPWDReset':(userName)=>{
    const userId = Users.findOne({'username':userName});
    if(userId && userId.isPasswordReseted){
      return true;
    }else{
      return false;
    }

  }
});
