import fs from 'fs';
import os from 'os';
import path from 'path';
import Reports from '/server/pr-schema/models/reports';
import Orders from '/server/pr-schema/models/orders';
import TesterOps from '/server/pr-schema/models/testerOps';
import Users from '/server/pr-schema/models/users';
import Categories from '/server/pr-schema/models/categories';
import Meta from '/server/pr-schema/models/meta';
import { getRandomInt, round, round2 } from '/server/kh-helpers/math';
import { Accounts } from 'meteor/accounts-base';

var sampleimg = "data:image/png;base64,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";

var creatfunc = function(){
  const theOnlyUser = Users.find().fetch();
  var uids = [];
  if (theOnlyUser.length == 0) {
  var userlist1 = [
      {name:"admin",password:"pass",phone:"13344445555",emails:[{address:"abc@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:1,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false},
    {name:"agent",password:"pass",phone:"1334444666",emails:[{address:"abc1@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:6,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false},
    {name:"keeper",password:"pass",phone:"1334444777",emails:[{address:"abc2@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:7,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false},
    {name:"assigner",password:"pass",phone:"1334444887",emails:[{address:"abc3@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:8,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false},
    {name:"tester1",password:"pass",phone:"1334444889",emails:[{address:"abc4@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:9,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false},
    {name:"tester2",password:"pass",phone:"1334444897",emails:[{address:"abc5@def.com"}],avatarImg:sampleimg,createAt:1496370795,role:9,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false}
    ];

  console.log('Creating users: ');
    _.each(userlist1, function(userData) {
      console.log(userData);
      id = Accounts.createUser({
        username : userData.name,
        password: userData.password});
  Users.update(id,{ $set:{phone:userData.phone,
        name: userData.name,  emails:userData.emails,createdAt:userData.createdAt, addr:userData.addr, extraEvents: userData.extraEvents,
         avatarImg:userData.avatarImg, role:userData.role, lastMessageEnterTime:userData.lastMessageEnterTime, receiveMsgs:userData.receiveMsgs,isPasswordReseted:userData.isPasswordReseted}}
         );
    uids.push(id);
  });
  var userlist2 = [
    {name:"custom",password:"pass",paymentPwd:"paypass",phone:"1334444987",emails:[{address:"abc@def.com"}],avatarImg:sampleimg,createAt:1496370795,addr:[ {name:"张三",phone:13544445555,province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},{name:"李四",phone:13544445555,province:"江苏",city:"苏州",district:"玄武区",details:"中山路200号",zip:"000000"},],extraEvents:[{type:51,ts:3}],lastMessageEnterTime:0,receiveMsgs:false,receiveInfo:false,isPasswordRst:false,role:20,isPaymentPasswordSet:false,balance:100}
    ];
  var cid;
    _.each(userlist2, function(userData) {
      console.log('Creating custom users: ');
      console.log(userData);
      cid = Accounts.createUser({
        username : userData.name,
        password: userData.password,
		phone:userData.phone,
        name: userData.name,  emails:userData.emails,createdAt:userData.createdAt, avatarImg:userData.avatarImg, role:userData.role, lastMessageEnterTime:userData.lastMessageEnterTime, receiveMsgs:userData.receiveMsgs,isPasswordReseted:userData.isPasswordReseted,isPaymentPasswordSet:userData.isPaymentPasswordSet,balance:userData.balance
      });
    })
  }


  const noworders = Orders.find().fetch();
  var orderIDs = [];
  if (noworders.length == 0) {
  var orders=[
  {userId:cid, createdAt:1496372278, sampleName:"测试1", sampleProducer:"厂商1", producerBatch:"001", sampleType:"类别1", sampleLevel:"A",
     sampleBrand:"大厂", sampleNum:"123", clientName:"李四", clientContactName:"李四", clientContactPhone:"134444",
      clientContactIdent:"123213", clientEconomicType:"AAA", clientContactAddress:{name:"张三",phone:"13544445555",
      province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},
      reportNo:01,categoryName:"平板状建筑材料及制品、管状绝热材料",levelName:"合格",
      items:[{name:"外观质量",requirementss:{result:"400",verdict:true}}],
       price:1234, deadline:1496372278, note:"", ShippingInfo:[{provider:"申通",no:"AAAA",description:"abc"}],
      agent:uids[1], tester:[uids[4]],descImages:[sampleimg],
      sampleImages:[sampleimg],testingImages:[sampleimg], status:2, agentMsg:"通过", keeperMsg:"通过"},
    {userId:cid, createdAt:1496372298, sampleName:"测试2", sampleProducer:"厂商2", producerBatch:"002", sampleType:"类别1", sampleLevel:"A",
     sampleBrand:"大厂", sampleNum:"123", clientName:"李四", clientContactName:"李四", clientContactPhone:"134444",
      clientContactIdent:"123213", clientEconomicType:"AAA", clientContactAddress:{name:"张三",phone:"13544445555",
      province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},
      reportNo:01,categoryName:"平板状建筑材料及制品、管状绝热材料",levelName:"合格",
      items:[{name:"外观质量",requirementss:{result:"400",verdict:true}}],
       price:1234, deadline:1496372278, note:"", ShippingInfo:[{provider:"申通",no:"AAAA",description:"abc"}],
       agent:uids[1], tester:[uids[4]],descImages:[sampleimg],
      sampleImages:[sampleimg],testingImages:[sampleimg], status:2, agentMsg:"通过", keeperMsg:"通过"},
    {userId:cid, createdAt:1496371298, sampleName:"测试3", sampleProducer:"厂商3", producerBatch:"002", sampleType:"类别1", sampleLevel:"A",
     sampleBrand:"大厂", sampleNum:"123", clientName:"李四", clientContactName:"李四", clientContactPhone:"134444",
      clientContactIdent:"123213", clientEconomicType:"AAA", clientContactAddress:{name:"张三",phone:"13544445555",
      province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},
      reportNo:01,categoryName:"平板状建筑材料及制品、管状绝热材料",levelName:"合格",
      items:[{name:"外观质量",requirementss:{result:"400",verdict:true}}],
       price:1234, deadline:1496372278, note:"", ShippingInfo:[{provider:"申通",no:"AAAA",description:"abc"}],
       agent:null, tester:[uids[4]],descImages:[sampleimg],
      sampleImages:[sampleimg],testingImages:[sampleimg], status:2, agentMsg:"通过", keeperMsg:"通过"},
    {userId:cid, createdAt:1496331298, sampleName:"测试4", sampleProducer:"厂商4", producerBatch:"002", sampleType:"类别1", sampleLevel:"A",
     sampleBrand:"大厂", sampleNum:"123", clientName:"李四", clientContactName:"李四", clientContactPhone:"134444",
      clientContactIdent:"123213", clientEconomicType:"AAA", clientContactAddress:{name:"张三",phone:"13544445555",
      province:"江苏",city:"南京",district:"玄武区",details:"中山路200号",zip:"000000"},
      reportNo:01,categoryName:"平板状建筑材料及制品、管状绝热材料",levelName:"合格",
      items:[{name:"外观质量",requirementss:{result:"400",verdict:true}}],
       price:1234, deadline:1496372278, note:"",ShippingInfo:[{provider:"申通",no:"AAAA",description:"abc"}],
       agent:null, tester:[],descImages:[sampleimg],
      sampleImages:[sampleimg],testingImages:[sampleimg], status:2, agentMsg:"通过", keeperMsg:"通过"},
        ];
  console.log('Creating orders: ');
  _.each(orders, function(doc) {

      id = Orders.insert(doc);
    orderIDs.push(id);
    });
  }
/*
  const nowtestItems = TestItems.find().fetch();

  if (nowtestItems.length == 0) {
  var testItems=[
    {level:"A1", category:"平板状建筑材料及制品、管状绝热材料", testItems:"长度", testResult:[{requirements:"《480",result:"400",subjudgement:"合格"}], standard:"GJ2014-0086",  judgement:"合格", OrderID:orderIDs[0]},
  {level:"A1", category:"平板状建筑材料及制品、管状绝热材料", testItems:"长度", testResult:[{requirements:"《480",result:"400",subjudgement:"合格"}], standard:"GJ2014-0086",  judgement:"合格", OrderID:orderIDs[0]},
  ];
  console.log('Creating testItems: ');
  _.each(testItems, function(doc) {

      TestItems.insert(doc);
    });
  }
*/
  const nowtesterOps = TesterOps.find().fetch();

  if (nowtesterOps.length == 0) {
  var testerOps=[
    { levelName:"A",categoryName:"平板状建筑材料及制品、管状绝热材料", itemName:"长度", createAt:1496370795, requirements:"《480",result:"400",verdict:true, userID:uids[4], OrderID:orderIDs[0]}

  ];
  console.log('Creating testerOps: ');
  _.each(testerOps, function(doc) {

      TesterOps.insert(doc);
    });
  }

  const nowReport = Reports.find().fetch();

  if (nowReport.length == 0) {
  var Reportlist=[
  {"userId": uids[4],"orderId": orderIDs[0],"reportNo": 20170602001,"ProductName": "消费水袋", "InspectedBody":"新北区消费器材经营部", "KindofTest":"委托检验", "ContactAddress":"合肥市经济开发区汤口路9号", "zipcode":"230601", "contact":"马壮壮", "phone":"0551-68163189", "mobile":"15755193831", "ModelType": "B-65-26", "Manufacturer": "泰州市光华公司", "TradeMark": "祥和牌", "SampleGrade": "合格品", "SampleSite": "新北区河海路85号", "SampleBody": "常州市市场管理局", "SampleQuantity": "2盘", "SampleBase": "28盘", "ReceivedDate": 1496372278, "CommissionedUnits": "江苏工商局", "SamplingCondition": "正常", "ManufacturedLot": "2016.05", "SampleDate": "2016.10.21", "SampleStaff": "马壮壮", "TestPlace": "三室", "TestDate": "2016.10.27", "TestCriteria": "GB6246-2011", "TestItems": "共九项，详见附件", "TestConclusion": "合格", "Remark": "无"}
  ];
  console.log('Creating Report: ');
  _.each(Reportlist, function(doc) {

      Reports.insert(doc);
    });
  }
  const nowCategorie = Categories.find().fetch();

  if (nowCategorie.length == 0) {
  var Categorielist=[
  {"name":"平板状建筑材料及制品、管状绝热材料","levels":[{"name":"A","items":[{"name":"不燃性","standard":"GB8624-2012","requirements":{}},{"name":"总热值","standard":"GB8624-2012","requirements":{}},{"name":"单体燃烧","standard":"GB8624-2012","requirements":{}}]},{"name":"B1","items":[{"name":"可燃性","standard":"GB8624-2012","requirements":{}},{"name":"单体燃烧","standard":"GB8624-2012","requirements":{}}]},{"name":"B2","items":[{"name":"可燃性","standard":"GB8624-2012","requirements":{}},{"name":"单体燃烧","standard":"GB8624-2012","requirements":{}}]}]},{"name":"电线电缆套管","levels":[{"name":"B1","items":[{"name":"氧指数","standard":"GB8624-2012","requirements":{}},{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}},{"name":"烟密度等级","standard":"GB8624-2012","requirements":{}}]},{"name":"B2","items":[{"name":"氧指数","standard":"GB8624-2012","requirements":{}},{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}}]}]},{"name":"铺地材料","levels":[{"name":"A","items":[{"name":"不燃性","standard":"GB8624-2012","requirements":{}},{"name":"总热值","standard":"GB8624-2012","requirements":{}},{"name":"临界辐射通量","standard":"GB8624-2012","requirements":{}}]},{"name":"B1","items":[{"name":"可燃性","standard":"GB8624-2012","requirements":{}},{"name":"临界辐射通量","standard":"GB8624-2012","requirements":{}}]},{"name":"B2","items":[{"name":"临界辐射通量","standard":"GB8624-2012","requirements":{}}]}]},{"name":"窗帘幕布、家具制品装饰用织物","levels":[{"name":"B1","items":[{"name":"氧指数","standard":"GB8624-2012","requirements":{}},{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}}]},{"name":"B2","items":[{"name":"氧指数","standard":"GB8624-2012","requirements":{}},{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}}]}]},{"name":"纸面石膏板","levels":[{"name":"B1","items":[{"name":"可燃性","standard":"GB8624-2012","requirements":{}},{"name":"遇火稳定性","standard":"GB/T9775-2008","requirements":{}}]}]},{"name":"电器、家具制品用泡沫塑料","levels":[{"name":"B1","items":[{"name":"热释放速率","standard":"GB8624-2012","requirements":{}},{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}}]},{"name":"B2","items":[{"name":"垂直燃烧性能","standard":"GB8624-2012","requirements":{}}]}]},{"name":"饰面型防火涂料","levels":[{"name":"合格","items":[{"name":"火焰传播比值","standard":"GB 12441-2005","requirements":{}},{"name":"质量损失、炭化体积","standard":" GB 12441-2005","requirements":{}}]}]},{"name":"岩棉矿渣棉及其制品","levels":[{"name":"A","items":[{"name":"不燃性","standard":"GB8624-2012","requirements":{}},{"name":"总热值","standard":"GB8624-2012","requirements":{}},{"name":"热荷重收缩温度","standard":"GB/T11835-2007","requirements":{}}]}]},{"name":"防火门","levels":[{"name":"合格","items":[{"name":"防火锁、防火顺序器、防火合页、防火插销、耐火性能","standard":"GB12955-2008","requirements":{}}]}]},{"name":"防火卷帘","levels":[{"name":"合格","items":[{"name":"耐火性能","standard":"GB14102-2005","requirements":{}}]}]},{"name":"消防水带","levels":[{"name":"合格","items":[{"name":"外观质量","standard":"GB6246-2011","requirements":{}},{"name":"内径及极限偏差","standard":"GB6246-2011","requirements":{}},{"name":"标准长度及极限偏差","standard":"GB6246-2011","requirements":{}},{"name":"单位长度质量","standard":"GB6246-2011","requirements":{}},{"name":"试验压力","standard":"GB6246-2011","requirements":{}},{"name":"最小爆破压力","standard":"GB6246-2011","requirements":{}},{"name":"延伸率和膨胀率及扭转方向试验","standard":"GB6246-2011","requirements":{}},{"name":"弯曲试验","standard":"GB6246-2011","requirements":{}}]}]},{"name":"消防应急灯具","levels":[{"name":"合格","items":[{"name":"标志","standard":"GB17945-2010","requirements":{}},{"name":"主要部件检查","standard":"GB17945-2010","requirements":{}},{"name":"基本功能试验","standard":"GB17945-2010","requirements":{}},{"name":"充、放电试验","standard":"GB17945-2010","requirements":{}},{"name":"电压波动试验","standard":"GB17945-2010","requirements":{}},{"name":"转换电压试验","standard":"GB17945-2010","requirements":{}},{"name":"重复转换试验","standard":"GB17945-2010","requirements":{}},{"name":"充、放电耐久试验","standard":"GB17945-2010","requirements":{}},{"name":"绝缘电阻试验","standard":"GB17945-2010","requirements":{}},{"name":"耐压试验","standard":"GB17945-2010","requirements":{}},{"name":"接地电阻试验","standard":"GB17945-2010","requirements":{}}]}]},{"name":"室内消防栓","levels":[{"name":"合格","items":[{"name":"外观质量","standard":"GB3445-2005","requirements":{}},{"name":"密封件","standard":"GB3445-2005","requirements":{}},{"name":"基本尺寸与公差","standard":"GB3445-2005","requirements":{}},{"name":"开启高度","standard":"GB3445-2005","requirements":{}},{"name":"手轮","standard":"GB3445-2005","requirements":{}},{"name":"螺纹","standard":"GB3445-2005","requirements":{}},{"name":"密封性能","standard":"GB3445-2005","requirements":{}},{"name":"强度","standard":"GB3445-2005","requirements":{}},{"name":"固定接口","standard":"GB3445-2005","requirements":{}},{"name":"耐腐蚀性能","standard":"GB3445-2005","requirements":{}}]}]},{"name":"消防水枪","levels":[{"name":"合格","items":[{"name":"表面质量","standard":"GB8181-2005","requirements":{}},{"name":"螺纹 ","standard":"GB8181-2005","requirements":{}},{"name":"密封性能 ","standard":"GB8181-2005","requirements":{}},{"name":"耐水压强度 ","standard":"GB8181-2005","requirements":{}},{"name":"抗跌落性能 ","standard":"GB8181-2005","requirements":{}},{"name":"耐腐蚀性能 ","standard":"GB8181-2005","requirements":{}}]}]},{"name":"手提式干粉灭火器","levels":[{"name":"合格","items":[{"name":"标志及外观检查 ","standard":"GB4351.1-2005","requirements":{}},{"name":"20℃喷射性能试验 ","standard":"GB4351.1-2005","requirements":{}},{"name":"灭火器总质量及充装误差 ","standard":"GB4351.1-2005","requirements":{}},{"name":"灭火器提把和压把","standard":"GB4351.1-2005","requirements":{}},{"name":"筒体水压试验 ","standard":"GB4351.1-2005","requirements":{}},{"name":"筒体爆破试验 ","standard":"GB4351.1-2005","requirements":{}},{"name":"筒体底部结构要求 ","standard":"GB4351.1-2005","requirements":{}},{"name":"可重复充装灭火器的充装口内径 ","standard":"GB4351.1-2005","requirements":{}},{"name":"灭火器器头或阀门要求 ","standard":"GB4351.1-2005","requirements":{}},{"name":"抗腐蚀性能","standard":"GB4351.1-2005","requirements":{}},{"name":"灭火剂主要组分含量","standard":"GB4351.1-2005","requirements":{}}]}]},{"name":"消防接口","levels":[{"name":"合格","items":[{"name":"外观质量","standard":"GB12514.1-2005","requirements":{}},{"name":"基本尺寸","standard":"GB12514.1-2005","requirements":{}},{"name":" 密封性能 ","standard":"GB12514.1-2005","requirements":{}},{"name":"水压性能","standard":"GB12514.1-2005","requirements":{}},{"name":"抗跌落性能","standard":"GB12514.1-2005","requirements":{}},{"name":"耐腐蚀性能","standard":"GB12514.1-2005","requirements":{}}]}]},{"name":"消防软管卷盘","levels":[{"name":"合格","items":[{"name":"外观质量","standard":"GB15090-2005","requirements":{}},{"name":"软管性能","standard":"GB15090-2005","requirements":{}},{"name":"结构要求","standard":"GB15090-2005","requirements":{}},{"name":"密封性能","standard":"GB15090-2005","requirements":{}},{"name":"耐压性能","standard":"GB15090-2005","requirements":{}},{"name":"耐腐蚀性能","standard":"GB15090-2005","requirements":{}}]}]}];
  console.log('Creating Categorie: ');
  _.each(Categorielist, function(doc) {

      Categories.insert(doc);
    });
  }
  const nowMeta = Meta.find().fetch();
  if(nowMeta.length ===0){
    Meta.insert({"name":"reportNo","value":1});
  }
}


export default function addDummyData() {
  creatfunc();
}
