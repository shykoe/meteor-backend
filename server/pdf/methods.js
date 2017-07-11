import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { generateComponentAsPDF } from './generate-pdf';
import Orders from '/server/pr-schema/models/orders';
import Reports from '/server/pr-schema/models/reports';
import TesterOps from '/server/pr-schema/models/testerOps';
import cheerio from 'cheerio';
import fs from 'fs';

Meteor.methods({
	'documents.download': (req) => {
		const fileName = `document_1.pdf`;
	    var data = fs.readFileSync("../../../../../server/pdf/template.html","utf-8");
	    const $ = cheerio.load(data);
	    const rep = Reports.findOne({'orderId':req.documentId});
	    const order = Orders.findOne({'_id':req.documentId});
	    //deal data
	    //console.log(req.documentId, rep)
	    if(order){
	    	const items = order.items;
	    	const table = $("#Items tbody");
  			for(var i=0; i<items.length; i++){
  			  if(items[i].requirements){
  			  	var verdict = items[i].requirements.verdict ? "通过":"未通过";
  			    const content = "<tr><td >" + i + "</td><td>" + items[i].name + "</td> <td>" + verdict + "</td></tr>";
  			    table.append(content);
  			  }
	    	}
	    }

	    if(rep){
  			const ContactAddress_zipcode = $("#ContactAddress_zipcode");
  			ContactAddress_zipcode.append(rep.zipcode);
  			const phone = $("#phone");
  			phone.append(rep.phone);
  			const mobile = $("#mobile");
  			mobile.append(rep.mobile);
  			const contact = $("#contact");
  			contact.append(rep.contact);
  			const InspectedBody = $("#InspectedBody");
  			InspectedBody.append(rep.InspectedBody);
  			const ProductName = $("#ProductName");
  			ProductName.append(rep.ProductName);
  			const reportNo = $("#reportNo2");
  			reportNo.append(String(rep.reportNo));
  			const InspectedBody2 = $("#InspectedBody2");
  			InspectedBody2.append(rep.InspectedBody);
  			const ProductName2 = $("#ProductName2");
  			ProductName2.append(rep.ProductName);
  			const KindofTest = $("#KindofTest");
  			KindofTest.append(rep.KindofTest);
  			const KindofTes2 = $("#KindofTes2");
  			KindofTes2.append(rep.KindofTest);
  			const ModelType = $("#ModelType");
  			ModelType.append(rep.ModelType);
  			const TestCriteria = $("#TestCriteria");
  			TestCriteria.append(rep.TestCriteria);
  			const Manufacturer = $("#Manufacturer");
  			Manufacturer.append(rep.Manufacturer);
  			const TradeMark = $("#TradeMark");
  			TradeMark.append(rep.TradeMark);
  			const SampleGrade = $("#SampleGrade");
  			SampleGrade.append(rep.SampleGrade);
  			const SampleSite = $("#SampleSite");
  			SampleSite.append(rep.SampleSite);
  			const SampleBody = $("#SampleBody");
  			SampleBody.append(rep.SampleBody);
  			const SampleQuantity = $("#SampleQuantity");
  			SampleQuantity.append(rep.SampleQuantity);
  			const SampleBase = $("#SampleBase");
  			SampleBase.append(rep.SampleBase);
  			var date = new Date(rep.ReceivedDate)
  			const ReceivedDate = $("#ReceivedDate");
  			ReceivedDate.append(date.toLocaleDateString());
  			const CommissionedUnits = $("#CommissionedUnits");
  			CommissionedUnits.append(rep.CommissionedUnits);
  			const SamplingCondition = $("#SamplingCondition");
  			SamplingCondition.append(rep.SamplingCondition);
  			const ManufacturedLot = $("#ManufacturedLot");
  			ManufacturedLot.append(rep.ManufacturedLot);
  			const SampleDate = $("#SampleDate");
  			SampleDate.append(rep.SampleDate);
  			const SampleStaff = $("#SampleStaff");
  			SampleStaff.append(rep.SampleStaff);
  			const TestPlace = $("#TestPlace");
  			TestPlace.append(rep.TestPlace);
  			const TestDate = $("#TestDate");
  			TestDate.append(rep.TestDate);
  			const TestItems = $("#TestItems");
  			TestItems.append(rep.TestItems);
  			const TestConclusion = $("#TestConclusion");
  			TestConclusion.append(rep.TestConclusion);
  			const Remark = $("#Remark");
  			Remark.append(rep.Remark);
  		}

	    const base64 = generateComponentAsPDF( $.html() , fileName);
	    return base64;
	}
})
