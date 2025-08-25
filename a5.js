const metersStorage = "meters4";
const monthStorage = "allMonths4";
const billStorage = "allBills3";
let tempMeterNameMonthName = "";
let meters = JSON.parse(localStorage.getItem(metersStorage)) || [];
let allMonths = JSON.parse(localStorage.getItem(monthStorage)) || [];
let allBills = JSON.parse(localStorage.getItem(billStorage)) || [];
let meterName = "";
let monthName = "";
let tindex = 0;
let billDate = "";
let currentReading = 0;
let consumption = 0;
let amount = 0;
let nodays = "do not know";
let totUnits = 0;
let perdayavg = 0;
let mncolors = [
  '#FF6F61',  // softer red-orange, good contrast
  '#FFD54F',  // warm yellow, excellent contrast
  '#4CAF50',  // medium green, good contrast
  '#42A5F5',  // bright blue, good contrast
  '#5C6BC0',  // medium purple-blue, good contrast
  '#26C6DA'   // cyan, good contrast
];
var sbb = 3; //space b.w bars usd in asd func
var wd = 15; //bar width usd in asd func
var fsize = 11; //bar width usd in asd func
var currx = 0; //current x position usd in asd func



//data managment (export and import) section start here

function exportData() {
  // Collect all relevant localStorage data
  const exportData = {
    meters: JSON.parse(localStorage.getItem('meters4') || '[]'),
    months: JSON.parse(localStorage.getItem('allMonths4') || '[]'),
    bills: JSON.parse(localStorage.getItem('allBills3') || '[]'),
    readings: {}
  };

  // Collect dynamic meter-month entries
  exportData.meters.forEach(meter => {
    exportData.months.forEach(month => {
      const key = `${meter}_${month}`;
      exportData.readings[key] = JSON.parse(localStorage.getItem(key) || '[]');
    });
  });

  // Create and trigger download
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meter_data_${formatDateTime(new Date()).replaceAll(" ","").replaceAll(":","")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Clear existing data
      localStorage.clear();

      // Restore base data
      localStorage.setItem('meters4', JSON.stringify(importedData.meters));
      localStorage.setItem('allMonths4', JSON.stringify(importedData.months));
      localStorage.setItem('allBills3', JSON.stringify(importedData.bills));

      // Restore meter-month readings
      Object.entries(importedData.readings).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      // Refresh UI
      // displayMeters();
      alert('Data imported successfully!');
      //showMessageDialog("Data imported successfully!","td5");
      location.reload();
    } catch (error) {
      alert('Error importing data: ' + error.message);
    }
  };
  reader.readAsText(file);
}

//data managment (export and import data) section end

function generateMeters() {
  //this method print all meters at topMeters
  let a = document.getElementById("topMeters");
  let meters = JSON.parse(localStorage.getItem(metersStorage)) || [];
  let msum = 0;
  let csum = 0;
  let nmccsum = 0;

  let b  = "<table><tr>";
  meters.forEach((meterName) => {
    const result = getLatestMonthAndAmount(meterName);
    if(meterName.startsWith("CC")) {
      //sum for cc
      csum = result.amount + csum;
      console.log(result.month);
      console.log(result.monthNames);
      let nmonthname = getNextMonthName(result.monthNames,new Date().getFullYear()%100);
      console.log(nmonthname);
      let hjs = JSON.parse(localStorage.getItem(meterName+"_"+nmonthname)) || [];
      //JSON.parse(localStorage.getItem("CCM_Aug 25")) || [];
      console.log(hjs);
      
      let nhb1 = hjs.length > 0 ?  hjs[hjs.length -1].units : 0;
      console.log(nhb1);
      nmccsum = nhb1 + nmccsum;


    }
    else {
      //sum for msum
      msum = result.amount + msum;
    }
    b += `<td onclick="showMonthsForMeter('${meterName}')">${meterName} <br>${result.month} ${result.amount.toLocaleString()}</td>`;
  }); 
  b += "</tr>";
  b += "<tr><td>Total</td><td>Meter<br>" + msum.toLocaleString() + "</td><td></td>";
  b += "<td>CC<br>" + csum.toLocaleString() + "</td>";
  b += "<td>Next CC<br>" + nmccsum.toLocaleString() + "</td>";
  b += "</tr>";
  b += "</table>";
  //b += "this is from mohsin rao csum = " + csum + " and for msum = " + msum;
  //b += "the next month cc sum is " + nmccsum;
  a.innerHTML = b;
}

//get highest month and it's attributes to print at the top of the page
function getLatestMonthAndAmount(meterName) {
  // Filter bills where TID starts with the meter name (case-sensitive)
  const filteredBills = allBills.filter(bill =>
    bill.tid.startsWith(meterName)
  );

  if (filteredBills.length === 0) {
    return ``;
  }

  // Sort by billDate descending to get the latest
  filteredBills.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));

  const latestBill = filteredBills[0];

  // Extract month name from billDate
  const date = new Date(latestBill.billDate);
  const monthName = date.toLocaleString('default', { month: 'long' });
  const monthNames = date.toLocaleString('default', { month: 'short' });

  return {
    meter: meterName,
    month: monthName,
    amount: latestBill.amount
    ,monthNames : monthNames
  };
}
//end chatGpt 16 Jun 25 7:41 PM



function displayMeters(totest) {
  //document.getElementById("topMeters").innerHTML = "";
  document.getElementById("tgraphs").innerHTML = "";
  const td1 = document.getElementById("td1");
  const td2 = document.getElementById("td2");
  const td3 = document.getElementById("td3");
  const td4 = document.getElementById("td4");
  td1.innerHTML = `<h5>All Months</h5>`;
  td2.innerHTML = `<h5>Month Data</h5>`;
  td3.innerHTML = `<h5>Meter Name</h5>`;
  td4.innerHTML = `<h5>Current Loop Month</h5>`;
  //let aa = JSON.stringify(meters,null,2);
  const content = document.getElementById("content");
  let atem = `<h5>Available Meters</h5><div class="wrapper">`;
  //content.innerHTML = `<h5>Available Meters</h5>`;
  meters.forEach((meterName) => {
    const allMonths = JSON.parse(localStorage.getItem(monthStorage)) || [];
    td1.innerHTML += "<p>"+JSON.stringify(allMonths)+"</p>";
    td3.innerHTML += "<p>"+meterName+"</p>";
    const monthConsumptions = allMonths.map((monthName) => {
      const monthData = JSON.parse(localStorage.getItem(`${meterName}_${monthName}`)) || [];
      td2.innerHTML += "<p>"+`${meterName}_${monthName}`+":"+JSON.stringify(monthData)+"</p>";
      td4.innerHTML += "<p>"+monthName+"</p>";
      let maxUnits = Math.max(...monthData.map(entry => entry.units));
      maxUnits = maxUnits == -Infinity ? 0 : maxUnits;
      let minUnits = Math.min(...monthData.map(entry => entry.units));
      minUnits = minUnits == Infinity ? 0 : minUnits;
      let unitDifference = maxUnits - minUnits;
      let closeStatus = "open";
      allBills.forEach(aaa => { 
        if(aaa.tid==meterName + "_"+monthName) {
          closeStatus = "<span class='liclosed'>closed</span>";
        }
      }
      );
      const totalMonthConsumption = monthData.reduce((sum, entry) => sum + entry.consumption, 0);
      return { monthName, unitDifference,closeStatus };
    });
    const totalConsumption = monthConsumptions.reduce((sum, m) => sum + m.unitDifference, 0);
    const monthDetails = monthConsumptions
      .filter((m) => m.unitDifference > 0) // Only show months with entries
      .map((m) => `<li>${m.monthName}: ${m.unitDifference} units (${m.closeStatus})</li>`)
      .join("");

    atem += `
      <div class="box" onclick="showMonthsForMeter('${meterName}')">
        <h1>${meterName}</h1>
        <p>Total Consumption: ${totalConsumption} units</p>
        <ul>${monthDetails}</ul>
      </div>
    `;
  });
  atem += `</div><br><button class="no-button" onclick="showForm()">Add Meter</button>`;
  atem += `<br><button class="no-button" onclick="showDebugInfo()">Show Debug Info</button>`;
  content.innerHTML = atem;
  totest == 1 ? hidesidebar() : null;
}

function showDebugInfo() {
  document.getElementById("tdebug").classList.remove("confirm-dialog");
}


function addMeter(event) {
  //document.getElementById("tgraph").innerHTML = "";
  document.getElementById("tgraphs").innerHTML = "";
  event.preventDefault();
  const meterName = document.getElementById("meterName").value.trim();
  if (!meterName) {
    alert("Please fill out all fields correctly.");
    return;
  }

  if (meters.includes(meterName)) {
    alert("Meter already exists!");
    return;
  }

  meters.push(meterName);
  localStorage.setItem(metersStorage, JSON.stringify(meters));
  displayMeters(0);
}

function showCreateMonthForm(totest) {
  //document.getElementById("tgraph").innerHTML = "";
  document.getElementById("tgraphs").innerHTML = "";
  const content = document.getElementById("content");
  content.innerHTML = `
    <h5>Add New Month</h5>
    <form id="addMonthForm">
      <input type="text" id="monthName" placeholder="Month Name (e.g., Jan 25)" required>
      <div class="buttons"><button class="no-button" type="submit">Add Month</button></div>
    </form>
  `;
  document.getElementById("addMonthForm").addEventListener("submit", addMonth);
  totest == 1 ? hidesidebar() : null;
}

function addMonth(event) {
  event.preventDefault();
  const monthName = document.getElementById("monthName").value.trim();
  if (!monthName || allMonths.includes(monthName)) {
    alert("Month already exists or invalid!");
    return;
  }
  allMonths.push(monthName);
  localStorage.setItem(monthStorage, JSON.stringify(allMonths));
  showMonths();
}

function datediffdays(date1,date2) { 
  date1 = new Date(date1);
  date2 = new Date(date2);
  //console.log("date1 = " + date1.toDateString());
  //console.log("date2 = " + date2.toDateString());
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

//hour difference
function hourdiffdays(date1,date2) { 
  date1 = new Date(date1);
  date2 = new Date(date2);
  //console.log("date1 = " + date1.toDateString());
  //console.log("date2 = " + date2.toDateString());
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  //const diffDays = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffDays = (diffTime / (1000 * 60 * 60));
  return diffDays;
}

function mindiffdays(date1,date2) { 
  date1 = new Date(date1);
  date2 = new Date(date2);
  //console.log("date1 = " + date1.toDateString());
  //console.log("date2 = " + date2.toDateString());
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60));
  return diffDays;
}

function countDistinctDates(entries) {
  const distinctDatesWithChange  = new Set();
  let mindiff = 0;   //total minutes of consumption
  let hourdiff = 0;   //total hour of consumption
  let previousDate  = null;
  let previousUnits = null; // Keep track of the previous units value
  entries.forEach(item => {
    if (item.date && typeof item.units === 'number') { // Ensure 'units' is a number
      if (previousUnits === null) {
        previousUnits = item.units; // Initialize previousUnits for the first entry
        previousDate = item.date;
        // Do not add the date of the first record
      }
      else if (item.units !== previousUnits) {
        //const nextDate = index == entries.length - 1 ? 0 : entries[index+1].date;
        const dateOnly = item.date.split('T')[0];
        mindiff = mindiff + mindiffdays(previousDate,item.date);
        //console.log("minute diff is " + mindiffdays(previousDate,item.date));
        hourdiff = hourdiff + hourdiffdays(previousDate,item.date);
        //console.log("**hour diff is " + hourdiffdays(previousDate,item.date));
        distinctDatesWithChange.add(dateOnly);
        previousUnits = item.units; // Update previousUnits
        previousDate = item.date;  //Udate previousDate
      }
      else {
        previousUnits = item.units;
        previousDate = item.date;  //Udate previousDate
      }
    }
  });
  //console.log("the total minutes = " + mindiff);
  //console.log("the total hours = " + hourdiff);
  //console.log("the total hours/24 = " + (hourdiff/24));
  let x = (parseInt(hourdiff/24));
  let xx = (parseInt(hourdiff%24));
  if (x > 1) {
    nodays = x + "days ";
  }
  else if (x == 1) {
    nodays = x + "day ";
  }
  else {
    nodays = "";
  }
  if (xx > 1) {
    nodays += " and " + xx + "hours";
  }
  else if (xx == 1) {
    nodays += " and " + xx + "hour";
  }
  else {
    nodays += "";
  }
  //nodays = x + "days and " + parseInt(hourdiff%24) + "hour(s)";
  //nodays = x + "days and " + parseInt(hourdiff%24) + "hour(s)";
  //console.log("the total days = " + nodays);
  totUnits = getUnitDiff(entries);
  //console.log("per min unit consumption = " + (totUnits/mindiff));
  //console.log("per hour unit consumption = " + (totUnits/hourdiff));
  perdayavg = ((totUnits/hourdiff)*24).toFixed(2);
  //console.log("per day unit consumption = " + perdayavg);
  return distinctDatesWithChange;
}


function getUnitDiff(a) {
  let maxUnits = Math.max(...a.map(entry => entry.units));
  maxUnits = maxUnits == -Infinity ? 0 : maxUnits;
  let minUnits = Math.min(...a.map(entry => entry.units));
  minUnits = minUnits == Infinity ? 0 : minUnits;
  let unitDifference = maxUnits - minUnits;
  //console.log("i am in getUnitDiff retvalu = " + unitDifference);
  return unitDifference;
}

function showMonthsForMeter(meterName) {
  const content = document.getElementById("content");
  let lastbill = "NotMatched";
  let btext = ``;
  let onceonly = 0;
  let motest = 0;
  let motest2 = 0;
  let motest3 = 0;
  let motest4 = 0;
  let motest5 = 0;
  let ccms_totunits = 0;
  let tdexpectedconshalf = 0;
  let tdexpectedcons = 0;
  let tcurmonname = "";
  btext = `<h5>Months for Meter: ${meterName}</h5>`;
  //btext += `<div class="buttons"><button class="yes-button" onclick="displayMeters(0)">Back</button></div>`;
  allMonths.forEach((monthName,index) => {
  let monthEntries = JSON.parse(localStorage.getItem(meterName+"_"+monthName)) || [];
  let distinctDates = new Set();
  distinctDates = countDistinctDates(monthEntries);
  let maxUnits = Math.max(...monthEntries.map(entry => entry.units));
  maxUnits = maxUnits == -Infinity ? 0 : maxUnits;
  let minUnits = Math.min(...monthEntries.map(entry => entry.units));
  minUnits = minUnits == Infinity ? 0 : minUnits;
  let unitDifference = maxUnits - minUnits;
  let stdate = Math.min(...monthEntries.map(entry => new Date(entry.date)));
  let endate = Math.max(...monthEntries.map(entry => new Date(entry.date)));
  let daysConsumption = datediffdays(stdate,endate);
  //console.log("start Date = " + formatDateTime(stdate));
  //console.log("end Date = " + formatDateTime(endate));
  //console.log("diff days = " + daysConsumption);
  let monthclosedname = "open";
  allBills.forEach(aaa => {
    if(aaa.tid==meterName + "_"+monthName) {
      let hy = datediffdays(stdate,endate);
      monthclosedname = "closed";
      monthclosedname += "<br>Amount :" + aaa.amount;
      monthclosedname += "<br>Consumption :" + aaa.consumption;
      monthclosedname += "<br>Reading :" + aaa.currentReading;
      monthclosedname += "<br>Bill Date :" + formatDateTime(aaa.billDate,1);
      monthclosedname += "<br>Start Date :" + formatDateTime(new Date(stdate),1);
      monthclosedname += "<br>End Date :" + formatDateTime(new Date(endate),1);
      // monthclosedname += "<br>Days :" + distinctDates.size;
      monthclosedname += "<br>"+nodays;
      // monthclosedname += "<br>Average :" + (aaa.consumption/distinctDates.size).toFixed(2);
      monthclosedname += "<br>Average:" + perdayavg;
      lastbill = aaa.tid;
    }
  });
  hfd = allBills.filter((m) => m.tid==lastbill);
  if(hfd.length > 0) {
  nextMonthBillDate = new Date(hfd[0].billDate);
  }
  else {
    nextMonthBillDate = new Date(stdate);
  }
  nextMonthBillDate.setMonth(nextMonthBillDate.getMonth() + 1);
  let diffdays = datediffdays(stdate,new Date(nextMonthBillDate));
  let diffdays2 = datediffdays(new Date(nextMonthBillDate),new Date());
  console.log("i am here the value of diffdays is " + diffdays2);
  console.log("the value of start date is " + new Date());
  console.log("the value of nextMonthBillDate date is " + new Date(nextMonthBillDate));
  nextMonthBillDate = formatDateTime(nextMonthBillDate,1);
  todaydate = new Date();
  todaydate = formatDateTime(todaydate,1);
  if(monthclosedname == "open" && onceonly == 0) {
    let treaming = diffdays - daysConsumption;
    let treamingmo = diffdays - (totUnits/perdayavg);
    //let texpectedcons = ((tavg * treaming)+unitDifference).toFixed(0);
    tdexpectedcons = ((perdayavg * treaming)+unitDifference).toFixed(0);
    motest = ((perdayavg * treamingmo)+unitDifference).toFixed(0);
    motest3 = ((perdayavg * 20)).toFixed(0);
    motest4 = ((perdayavg * 10)).toFixed(0);
    motest5 = ((perdayavg * diffdays2)+unitDifference).toFixed(0);
    motest2 = (motest/2).toFixed(0);
    tcurmonname = monthName;
    btext += `<div class="meter-box" onclick="viewMonthEntries('${meterName}', '${monthName}')">
    <strong>${monthName}</strong>
    <h5>Consumption: ${unitDifference} units & amount ${calculateAmount(unitDifference)}
    <br>in ${nodays}<br>
    Average: ${perdayavg}<br>
    Start Date: ${formatDateTime(new Date(stdate),1)}<br>
    End Date: ${formatDateTime(new Date(endate),1)}
    </h5>
    <h5>Bill Status: ${monthclosedname}</h5>
    <h6>Today is : ${todaydate}
    <br>Next Bill : ${nextMonthBillDate}
    <br>Days Remaining : ${treaming}
    <br>Days Remaining : ${treamingmo.toFixed(2)}
    <br>Days Consumption Remaining : ${daysConsumption}
    <br>Diff Days2 Remaining : ${diffdays2}
    <br>_____________________________________________<br>
    <br>Exp Consump for 30days : ${(motest)} : ${calculateAmount((motest))}
    <br>Exp Consump for 20days : ${(motest3)} : ${calculateAmount((motest3))}
    <br>Exp Consump for 15days : ${(motest2)} : ${calculateAmount((motest2))}
    <br>Exp Consump for 10days : ${(motest4)} : ${calculateAmount((motest4))}
    <br>Exp Consump Till Last : ${(motest5)} : ${calculateAmount((motest5))}
    </h6>
    </div>
    `;
    onceonly = 1;
    ccms_totunits = totUnits;
  }
  else if(monthclosedname == "open" && onceonly == 1) {
    btext += `<div class="meter-box" onclick="showMessageDialog('you are not allowed to enter this month','td7')">
    <strong>${monthName}</strong>
    <h5>Total Consumption: ${unitDifference} units</h5>
    <h5>Bill Status: N/A</h5>
    </h6>
    </div>
    `;
  }
  else {
    btext += `<div class="close-box" onclick="viewMonthEntries('${meterName}', '${monthName}')">
    <strong>${monthName}</strong>
    <h5>Bill Status: ${monthclosedname}</h5>
    </h6></div>
    `;
  }
  });
  content.innerHTML = btext;
  content.innerHTML += "<br><br>fd<br><br>";
  if(meterName == "Gas") {
    //use not half let tdexpectedcons
    generateGraph(meterName,tdexpectedcons,tcurmonname);
  }
  else if (meterName == "KE1") {
    generateGraph(meterName,motest3,tcurmonname);
  }
  else if (meterName == "KE2") {
    generateGraph("KE2",motest5,tcurmonname);
  }
  else if(meterName.startsWith("CC")) {
    //do not use expected consumption, because it is a fix amount which i expensev
    generateGraph(meterName,ccms_totunits,tcurmonname);
  }
  else {
    if(!isNaN(motest2)){
      generateGraph(meterName,motest2,tcurmonname);
    }
    else {
      generateGraph(meterName,0,tcurmonname);
    }
  }
}


function showal() {
  let a = document.getElementById("selmf").value;
  //alert("you have selected\n" + a);
  let b = document.getElementById("selmt").value;
  //alert("you have selected\n" + b);
  let c = document.getElementById("selmet").value;
  //const content = document.getElementById("content");
  //alert("you have selected\n" + c);
  
  //content.innerHTML += 
  let f1 = getCompStr(a,c + "_" + a);
  let t1 = getCompStr(b,c + "_" + b);
  let tot1 = `<center><h4>Comparision Consumption from ${a} To ${b} for ${c}</h4></center>`;
  tot1 += `<table><tr><td style="vertical-align:bottom;">${f1.split("mohsinraokhan")[0]}</td><td style="vertical-align:bottom;">${t1.split("mohsinraokhan")[0]}</td></tr></table>`;
  tot1 += '<hr><br><h3>Rao Mohsin</h3>';
  tot1 += `<table><tr><td style="vertical-align:top;">${f1.split("mohsinraokhan")[1]}</td><td style="vertical-align:top;">${t1.split("mohsinraokhan")[1]}</td></tr></table>`;
  //tot1 += f1 + "<br>" + t1;
  let tot2 = `<canvas id="ac" width="600"  height="400"></canvas>`; 
  tot2 += `<br><canvas id="ac2" width="600"  height="400"></canvas>`; 
  document.getElementById("content").innerHTML = tot2;
  //canvas method call here
  //if meter is gas then set sbb and wd values
  //sbb = 3;
  //wd = 15;
  if(c.startsWith("KE")) {
    //sbb = 9;
    //wd = 25;
    //fsize = 15;
    //document.getElementById("ac").height = '400';
    //document.getElementById("ac2").height = '400';
    tot2 = `<canvas id="ac11" width="440"  height="400"></canvas>`; 
    tot2 += `<canvas id="ac12" width="440"  height="400"></canvas>`; 
    tot2 += `<br><canvas id="ac21" width="600"  height="400"></canvas>`; 
    tot2 += `<canvas id="ac22" width="600"  height="400"></canvas>`; 
    document.getElementById("content").innerHTML = tot2;
    currx = 0; //reset current x position
    asd('ac11',"KE1" + "_" + a);
    currx = 0;
    asd('ac12',"KE2" + "_" + a);
    currx = 0; //reset current x position
    asd('ac21',"KE1" + "_" + b);
    currx = 0; //reset current x position
    asd('ac22',"KE2" + "_" + b);
  }
  else {
    tot2 = "<table><tr><td>";
    tot2 += `<canvas id="ac" width="500"  height="500"></canvas>`; 
    tot2 += "</td>";
    tot2 += `<td><canvas id="ac2" width="500"  height="500"></canvas></td></tr></table>`; 
    document.getElementById("content").innerHTML = tot2;
    currx = 0; //reset current x position
    asd('ac',c + "_" + a);
    currx = 0; //reset current x position
    asd('ac2',c + "_" + b);
  }
}

function asd(x,mmname) {
  let m , n ;
  let totUnits1,nodays1,perdayavg1;
  let totUnits2,nodays2,perdayavg2;
  let monthEntries,monthEntries2;
  //if(mmname.split("_")[0].startsWith("KE")) {
  if(1==2) {
    //do something for ke special
    //make two seprate array for KE1 and KE2
    //then merge them into single one
    //
    m = JSON.parse(localStorage.getItem("KE1_"+mmname.split("_")[1])) || [];
    n = JSON.parse(localStorage.getItem("KE2_"+mmname.split("_")[1])) || [];
    countDistinctDates(m);
    totUnits1 = totUnits;
    nodays1  = nodays;
    perdayavg1  = perdayavg;
    console.log("perdayavg1 and perdayavg = " + perdayavg1 + " and " + perdayavg);

    countDistinctDates(n);
    totUnits2 = totUnits;
    nodays2  = nodays;
    perdayavg2  = perdayavg;
    console.log("perdayavg2 and perdayavg = " + perdayavg2 + " and " + perdayavg);

    //sum ke1 and ke2
    totUnits = totUnits1 + totUnits2;
    console.log("perdayavg1 = " + perdayavg1);
    console.log("perdayavg2 = " + perdayavg2);
    perdayavg = ((parseFloat(perdayavg1) + parseFloat(perdayavg2))/2).toFixed(2);
    console.log("perdayavg === " + perdayavg);
    nodays = nodays1 + " KE2 days = " + nodays2;
    monthEntries2 = [...m,...n];
    monthEntries = monthEntries2.sort((ax, bx) => new Date(ax.date) - new Date(bx.date));
  }
  else {
    //do something for other meters gas
    monthEntries = JSON.parse(localStorage.getItem(mmname)) || [];
    countDistinctDates(monthEntries);  //to set values for nodays totUnits and perdayavg
  }
  const canvas = document.getElementById(x);
  const ctx = canvas.getContext('2d');
  let tcount = 0;
  if(!mmname.split("_")[0].startsWith("KE")) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = 'green';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top'; // Align text to the top
  ctx.fillStyle = 'orange';
  ctx.fillText(mmname.split("_")[1], 29, canvas.height-20);
  ctx.fillStyle = 'green';
  ctx.fillText("Total Units: " + totUnits + " (" + nodays + ") Per Day Avg: " + perdayavg, 265, canvas.height-20);
  ctx.fillStyle = 'orange';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top'; // Align text to the top
  monthEntries.forEach((entry,index) => {
    //this is mohsin
    tcount = tcount + 1;
    const previousConsumption = index == monthEntries.length - 1 ? 0 : monthEntries[index+1].units - monthEntries[index].units;
    const nextDate = index == monthEntries.length - 1 ? 0 : monthEntries[index+1].date;
    let mdiff = nextDate == 0 ? 0 : mindiffdays(monthEntries[index].date,nextDate);
    let rateNormalizemin = mdiff == 0 ? 0 : ((previousConsumption/mdiff)*1440).toFixed(2);
    //console.log("i am in getcompstr of monthEntries for each loop" + rateNormalizemin);
    if(rateNormalizemin<=0) return;
    let h = 0;
    if(mmname.split("_")[0]=="Gas") {
      //set bar height for gas
      h = (rateNormalizemin/5)*300;
      canvas.style.transform = `rotate(${90}deg)`;

    }
    else if(mmname.split("_")[0].startsWith("CC")) {
      //set bar heiht for CC meter
      h = (rateNormalizemin/100000)*300;
    }
    else {
      //set bar height for KE meters
      h = (rateNormalizemin/20)*200;        
    }
   // console.log("the bar height is " + h);
    var tdate = (formatDateTime(monthEntries[index+1].date,1)).replaceAll(" ","");
    ctx.fillStyle = mncolors[index % mncolors.length];
    // Draw the bar
    ctx.fillRect(currx, canvas.height - 30 -h, wd, h);
    // Draw vertical text (value) centered in the bar
    ctx.save();
    ctx.translate(currx + wd/2, canvas.height - 30 - h + h/2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = fsize +  'px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    tdate = tdate + " (" + redlastzero(rateNormalizemin) + ")";
    ctx.fillText(tdate, 10, 0);
    ctx.restore();
    // Draw horizontal label above the bar
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    currx += wd + sbb; // Space between bars
  });
  //ctx.rotate(90 * Math.PI / 180);
}


function getCompStr(x,mmname) {
  let content = "";
  let content2 = "";
  let monthEntries = JSON.parse(localStorage.getItem(mmname)) || [];
  countDistinctDates(monthEntries);  //to set values for nodays totUnits and perdayavg
  let tcount = 0;
  let tx = 0;
  content += `<div class='tdtop'>
    <h4>${x}</h4>
    <h5>Total Consumption: ${totUnits} units</h5>
    <h5>Amount: ${calculateAmount(totUnits)}</h5>
    <h5>Average Consumption: ${perdayavg} units/day in ${nodays}</h5></div>`;
    content += `<div id="tgraph3">`;
    content2 += `<div id="tgraph3v">`;
    content2 += `<div class='theadc'><h4>${x}</h4></div>`;
    monthEntries.forEach((entry, index) => {
      tcount = tcount + 1;
      const previousConsumption = index == monthEntries.length - 1 ? 0 : monthEntries[index+1].units - monthEntries[index].units;
      const nextDate = index == monthEntries.length - 1 ? 0 : monthEntries[index+1].date;
      let mdiff = nextDate == 0 ? 0 : mindiffdays(monthEntries[index].date,nextDate);
      let rateNormalizemin = mdiff == 0 ? 0 : ((previousConsumption/mdiff)*1440).toFixed(2);
      console.log("i am in getcompstr of monthEntries for each loop" + rateNormalizemin);
      if(rateNormalizemin<=0) return;
      let barHeight = 0;
      if(mmname.split("_")[0]=="Gas") {
        //set bar height for gas
        barHeight = (rateNormalizemin/5)*100;
      }
      else if(mmname.split("_")[0].startsWith("CC")) {
        //set bar heiht for CC meter
        barHeight = (rateNormalizemin/100000)*300;
      }
      else {
        //set bar height for KE meters
        barHeight = (rateNormalizemin/20)*300;
      }
      console.log("the bar height is " + barHeight);
      content += `
        <div class="graph-bar" style="height:${barHeight}px; background-color:${mncolors[index % mncolors.length]};">
          <span  class="bar-label">${(formatDateTime(monthEntries[index+1].date)).replaceAll(" ","").slice(0,5)}</span>          
          <span class="bar-label3" style="margin-bottom:${barHeight}px";>${rateNormalizemin}</span>        
        </div>`;
      content2 += `
        <div class="graph-barv" style="height:30px;width:${barHeight}px; background-color:${mncolors[index % mncolors.length]};">
          <span  class="bar-labelv">${(formatDateTime(monthEntries[index+1].date,1)).replaceAll(" ","")}</span>          
          <span class="bar-label3v" style="left:${barHeight}px";>${rateNormalizemin}</span>        
        </div>`;
    });
    content += `</div>`;
    content2 += `</div>`;
    return content + "mohsinraokhan" + content2;
}


function redlastzero(hs) {
  //return whole number, if last digit zeros
  //otherwise return same no.
  let df = hs.indexOf(".");
  if(df < 0) return hs;
  df = df + 1;
  let lenn = hs.length;
  let retn = hs.slice(df,lenn);
  let fr = hs;
  if(retn == "00") {
    //return only first no
    fr = hs.slice(0,df-1);
  }
  return fr;
}



function showMonths(awe) {
  const content = document.getElementById(awe);
  let atem = `<h5>List of All Months</h5><div class="wrapper">`;
  atem += `<div class="wrapper">`;
  allMonths.forEach((monthName) => {
    atem += `
      <div class="box">
        <h1>${monthName}</h1>
      </div>
    `;
  });
  //atem += `</div><br><button class="no-button" onclick="showCreateMonthForm(0)">Create Month</button>`;
  content.innerHTML = atem;
  //totest == 1 ? hidesidebar() : null;
}


//from chatgpt, calculate average start here
function viewMonthEntries(meterName, monthName) {
  document.getElementById("tgraphs").innerHTML = "";
  tempMeterNameMonthName = meterName + "_" + monthName;
  let monthEntries = JSON.parse(localStorage.getItem(tempMeterNameMonthName)) || [];
  let monthEntries2 = monthEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate max, min, and unit difference
  const maxUnits = Math.max(...monthEntries.map(entry => entry.units));
  const minUnits = Math.min(...monthEntries.map(entry => entry.units));
  const unitDifference = maxUnits - minUnits;
  countDistinctDates(monthEntries);  //to set values for nodays totUnits and perdayavg

  // Calculate average consumption
  //const averageConsumption = monthEntries.length > 0 ? (unitDifference / monthEntries.length).toFixed(2) : 0;
  let tcount = 0;
  let tx = 0;
  const content = document.getElementById("content");
  content.innerHTML = `<br><div class="buttons"><button class="yes-button" onclick="showMonthsForMeter('${meterName}')">Back</button></div>`;
  content.innerHTML += allBills.some(bill => bill.tid === meterName+"_"+monthName) ? '':`
  <form id="addEntryForm">
    <h5>Add Daily Entry</h5>
    <input type="datetime-local" id="entryDate" required>
    <input type="number" id="entryUnits" placeholder="Units" required>
    <div class="buttons">
      <button class="no-button" type="submit">Add Entry</button>
    </div>
  </form>
  `;
  

  content.innerHTML += `
    <h4>Entries for <br>${meterName} - ${monthName}</h4>
    <h5>Total Consumption: ${totUnits} units</h5>
    <h5>Amount: ${calculateAmount(totUnits)}</h5>
    <h5>Average Consumption: ${perdayavg} units/day in ${nodays}</h5>
    <table class="dailyentry">
      <tr>
        <th>Date</th>
        <th>Units</th>
        <th>Conmptn</th>
        <th>Total</th>
        ${!allBills.some(bill => bill.tid === meterName+"_"+monthName) ? '<th>Action</th>' : ''}
      </tr>
      
      ${monthEntries2.map((entry, index) => {
        tcount = tcount + 1;
          let dindex = monthEntries.length - 1 - index;
          const previousConsumption = index == monthEntries.length - 1 ? 0 : monthEntries[index].units - monthEntries[index + 1].units;
          const previousConsumption2 = index == 0 ? unitDifference : monthEntries[index].units - monthEntries[monthEntries.length -1].units;
          const previousConsumption3 = index == monthEntries.length -1 ? 0 : monthEntries[index+1].units - monthEntries[monthEntries.length -1].units;
          tx = calculateAmount(previousConsumption2);
          let th = calculateAmount(previousConsumption3);
          //modify on 05 may 2025, Ensure values are strings and remove commas safely
          let pdiff = (parseInt(String(tx).replace(/,/g, '')) || 0) - (parseInt(String(th).replace(/,/g, '')) || 0);
          const nextDate = index == monthEntries.length - 1 ? 0 : monthEntries[index+1].date;
          let mdiff = nextDate == 0 ? 0 : mindiffdays(monthEntries[index].date,nextDate);
          let rateNormalizemin = mdiff == 0 ? 0 : ((previousConsumption/mdiff)*1440).toFixed(2);
          return `
            <tr>
              <td>(${mdiff}) ${(formatDateTime(entry.date)).replaceAll(" ","")}</td>
              <td>(${rateNormalizemin}) ${entry.units}</td>
              <td>${previousConsumption} (${pdiff.toLocaleString()})</td>
              <td>${previousConsumption2} (${calculateAmount(previousConsumption2)})</td>
              ${!allBills.some(bill => bill.tid === meterName+"_"+monthName) ? `
              <td>
                <div class="buttons">
                  <button class="yes-button" onclick="confirmDeleteP(${dindex}, 'monthEntries')">${dindex} Delete</button>
                  <button class="no-button" onclick="addBill('${meterName}', '${monthName}', ${dindex})">Close</button>
                </div>
              </td>
              ` : ''}
            </tr>`;
      }).join('')}
    </table>`;
    content.innerHTML += "<br><br><br><br>";

  document.getElementById("addEntryForm").addEventListener("submit", (event) => addMonthEntry(event, meterName, monthName));
} //from chatgpt, calculate average end here

// Function to move all entries after a given index to the next month
//before closing month, it should ask user amount, and store following information 
//monthName,meterName,amount,units in billStorage array
//all information is availbe monthName, metername units, just ask amount before closing month
function closeEntries(meterName, monthName, index) {
  //allMonths = JSON.parse(localStorage.getItem(monthStorage)) || [];
  let currentMonthKey = `${meterName}_${monthName}`;
  let monthEntries = JSON.parse(localStorage.getItem(currentMonthKey)) || [];

  if (index >= monthEntries.length - 1) {
    showMessageDialog("No future entries to move.","td5");
    return false;
  }

  // Get the entries to be moved
  let movedEntries = monthEntries.splice(index + 1);
  monthEntries.push({ date: billDate, units: currentReading, consumption: consumption });
  localStorage.setItem(currentMonthKey, JSON.stringify(monthEntries));

  // Determine the next month
  let [currentMonth, currentYear] = monthName.split(" ");
  let nextMonthName = getNextMonthName(currentMonth, currentYear);
  let nextMonthKey = `${meterName}_${nextMonthName}`;

  // If next month does not exist, add it to the list
  if (!allMonths.includes(nextMonthName)) {
    allMonths.push(nextMonthName);
    localStorage.setItem(monthStorage, JSON.stringify(allMonths));
  }

  // Get existing data for the next month and add moved entries
  let nextMonthEntries = JSON.parse(localStorage.getItem(nextMonthKey)) || [];
  nextMonthEntries.push({ date: billDate, units: currentReading, consumption: 0 });
  nextMonthEntries = [...nextMonthEntries, ...movedEntries];
  localStorage.setItem(nextMonthKey, JSON.stringify(nextMonthEntries));

  // Refresh the page
  //viewMonthEntries(meterName, monthName);
  alert("bill successfully submitted");
  return true;
}





// Function to get the next month name
function getNextMonthName(currentMonth, currentYear) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let monthIndex = months.indexOf(currentMonth);

  if (monthIndex === -1) return currentMonth; // Fallback to prevent errors

  if (monthIndex === 11) {
    return `Jan ${parseInt(currentYear) + 1}`;
  } else {
    return `${months[monthIndex + 1]} ${currentYear}`;
  }
}

//chatgpt 23 apr 25 start here
function formatDateTime(dateTimeString, st, withdiff) {
  let b = " ";
  let options = "";
  let dateObj = new Date(dateTimeString);

  if (withdiff == 1) {
    // User wants date diff from now
    let a = new Date();
    b = "(" + datediffdays(dateObj, a) + ")";
  }

  let formatted = "";

  if (st == 1) {
    // Format: 23 Apr
    let day = dateObj.getDate();
    let month = dateObj.toLocaleString('en-US', { month: 'short' });
    formatted = `${day} ${month}`;
  } else {
    // Format: 23 Apr 3:12A
    let day = dateObj.getDate();
    let month = dateObj.toLocaleString('en-US', { month: 'short' });
    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes().toString().padStart(2, '0');
    let ampm = hours >= 12 ? 'P' : 'A';
    hours = hours % 12 || 12; // convert 0 to 12 for 12 AM
    formatted = `${day} ${month} ${hours}:${minutes}${ampm}`;
  }

  return formatted + b;
}
//chatgpt 23 apr 25 end here
let mykey_bnm = "";
function generateGraph(mname, curvalue, curmonname) {
  curvalue = Math.round(curvalue);
  let barHeight  = 0;
  let mainGraph = document.getElementById("tgraphs");
  let mainGraphtext = "<table><tr><th>Consumption & Amount History for "+getFullMeterName(mname)+"</th></tr><tr>"
  let graphHTML = "<td><div id='tgraph2'>";
  let i = 0;
  let maxConsumption = Math.max(...allBills
    .filter(bb => bb.tid.split('_')[0] === mname)
    .map((b) => b.consumption));
  maxConsumption = maxConsumption < curvalue ? curvalue : maxConsumption; // if the current month consumption 
  //is greater than all previous consmption, then set maxConsumption to current month consumption
  //so that prediction graph will be align.
  allBills.forEach((bb, index) => {
    let bmname = bb.tid.split('_')[1];
    if (bb.tid.split('_')[0] === mname) {
      barHeight = (bb.consumption/maxConsumption)*300;
      graphHTML += `
        <div class="graph-bar" style="height:${barHeight}px; background-color:${mncolors[i % mncolors.length]};">
          <span class="bar-label2">${bmname.split(' ')[0]}</span>
          <span class="bar-label">${bb.consumption.toLocaleString()}</span>
          <span class="bar-label3" style="margin-bottom:${barHeight}px;">${bb.amount.toLocaleString()}</span>
        </div>`;
      i++;
    }
  });

  barHeight = (curvalue/maxConsumption)*300;
  //let curBarHeight = curvalue + 20;
  graphHTML += `
    <div class="graph-bar" style="height:${barHeight}px; background-color:#aaaaaa;">
      <span class="bar-label2">${curmonname.split(' ')[0]}</span>
      <span class="bar-label">${curvalue.toLocaleString()} P</span>
      <span class="bar-label3" style="margin-bottom:${barHeight}px;">${calculateAmount(curvalue)}</span>
    </div>`;
  graphHTML += "</div></td>";
  mainGraphtext += graphHTML;
  mainGraphtext += "</tr></table>";
  mainGraph.innerHTML = mainGraphtext + `<button onclick=convertToPDF('3')>To PDF</button><br>`;
  mykey_bnm = addWidthToStyle(mainGraphtext, mname);
  localStorage.setItem("myKey", mykey_bnm); 

}

//on 01 Aug 2025 full qualified meter name 
function getFullMeterName(mname) {
  return {
    Gas: "Gas 4883730000",
    KE1: "KE1 0400005724412",
    KE2: "KE2 0400005724560",
    CCM: "Credit Card 4105 2400 0349 0297",
    CCJ: "Credit Card 4105 2400 0334 8008"
  }[mname] || "";
}
// function addWidthToStyle(html, mname) {
//   const width = (mname === "CCM" || mname === "CCJ") ? "66px" : "33px";
//   return html.replace(/style="(.*?)height:/g, `style="$1width:${width}; height:`);
// }

function addWidthToStyle(html, mname) {
  const isCreditCard = mname === "CCM" || mname === "CCJ";
  const width = isCreditCard ? "66px" : "33px";

  // Add width before height in style
  let modified = html.replace(/style="(.*?)height:/g, `style="$1width:${width}; height:`);

  // If CCM or CCJ, add extra styles to bar-label spans
  if (isCreditCard) {
    modified = modified.replace(/<span class="bar-label"/g, 
      `<span class="bar-label" style="writing-mode: horizontal-tb; font-size: 15px;"`);
    modified = modified.replace(/<span class="bar-label3" style="(.*?)"/g,
        `<span class="bar-label3" style="font-size:15px; $1"`
      );
  }
  else {
    modified = modified.replace(/<span class="bar-label"/g, 
      `<span class="bar-label" style="writing-mode: horizontal-tb;"`);
  }

  return modified;
}


//end 01 Aug 2025 



function addMonthEntry(event, meterName, monthName) {
  event.preventDefault();
  const entryDate = document.getElementById("entryDate").value;
  const entryUnits = parseFloat(document.getElementById("entryUnits").value);
  if (!entryDate || isNaN(entryUnits)) {
    alert("Please fill out all fields correctly.");
    return;
  }
  const monthEntries = JSON.parse(localStorage.getItem(`${meterName}_${monthName}`)) || [];
  const lastEntry = monthEntries[monthEntries.length - 1];
  const consumption = lastEntry ? entryUnits - lastEntry.units : 0;
  // if (lastEntry && consumption < 0) {
  //   alert("Units cannot be less than the previous reading.");
  //   return;
  // }
  monthEntries.push({ date: entryDate, units: entryUnits, consumption });
  localStorage.setItem(`${meterName}_${monthName}`, JSON.stringify(monthEntries));
  viewMonthEntries(meterName, monthName);
}


function showForm() {
  const content = document.getElementById("content");
  content.innerHTML = `<br><br><h5>Add New Meter</h5>
    <form id="addMeterForm">
      <input type="text" id="meterName" placeholder="Meter Name" required>
      <div class="buttons"><button class="no-button" type="submit">Add Meter</button></div>
    </form>
  `;
  document.getElementById("addMeterForm").addEventListener("submit", addMeter);
  hidesidebar();
}

//perplexity ai code
function confirmDeleteP(index,arrayType) {
  document.getElementById('arrayTypeText').innerHTML = arrayType;
  const confirmDialog = document.querySelector('.confirm-dialog');
  confirmDialog.style.display = 'block';
  document.querySelector('.yes45-button').onclick = function() {
      if(arrayType == "meter"){
        deleteMeterP(index);
      }
      else if(arrayType == "month"){
        deleteMonthP(index);
      }
      else if(arrayType == "monthEntries") {
        deletemonthEntriesP(index);
      }
      confirmDialog.style.display = 'none';
  };
  document.querySelector('.no45-button').onclick = function() {
      confirmDialog.style.display = 'none';
  };
}

function deleteMeterP(index) {
  //before deleting meter, it should also delete all it's entries
  deleteAllMonthEntriesofAMeter(index);
  meters.splice(index, 1); // Remove the meter from the array
  localStorage.setItem(metersStorage, JSON.stringify(meters)); // Update local storage
  displayMetersP(meters,'meter',0); // Refresh the display
}

function deleteAllMonthEntriesofAMeter(meterindex){
  //this function will be called when a meter will be deleted 
  //this function will delete from local storage of the meter entries agast the mont
  //meterName_MonthName save in this format in localstorage
  //i have to itrate all months the array name of all months is allMonths
  //localStorage.removeItem(meterName_allMonths[i]);
  //i only have the meter index, fom which i will get meter name
  //metername = meters[meterindex]
  let mname = meters[meterindex];
  let tcount = 0;
  let tmsg = "entries..."
  allMonths.forEach((monthName) => {
    localStorage.removeItem(mname+"_"+monthName);
    tcount = tcount + 1;
    tmsg += " : " + mname + "_" + monthName;
  });
  alert("total " + tcount +" Entries have been delete\nAnd the message is : " + tmsg);
}

function deleteMonthP(index) {
  allMonths.splice(index, 1); // Remove the meter from the array
  localStorage.setItem(monthStorage, JSON.stringify(allMonths)); // Update local storage
  displayMetersP(allMonths,'month',0); // Refresh the display
}

function deletemonthEntriesP(index) {
  let mname = tempMeterNameMonthName.split('_')[0];
  let monname = tempMeterNameMonthName.split('_')[1];
  const monthEntries = JSON.parse(localStorage.getItem(tempMeterNameMonthName)) || [];
  monthEntries.splice(index, 1); // Remove the meter from the array
  localStorage.setItem(tempMeterNameMonthName, JSON.stringify(monthEntries));
  console.log(mname);
  console.log(monname);
  viewMonthEntries(mname,monname);
}

function displayMetersP(asdf,arrayType,totest) {
  const content = document.getElementById("content");
  content.innerHTML = "<h6>This is a " + arrayType +" list </h6>"; // Clear existing content
  asdf.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${entry}</td>
          <td><div class="buttons"><button class="yes-button" onclick="confirmDeleteP(${index},'${arrayType}')">Delete</button></div></td>
      `;
      content.appendChild(row);
  });
  totest == 1 ? hidesidebar() : null;
}

function hidesidebar() {
  const sidebar = document.getElementById('sidebar');
  // Check if the sidebar is open
  if (sidebar.style.left === '0px') {
    sidebar.style.left = '-250px'; // Close sidebar
    document.body.style.marginLeft = '0';
  } else {
    sidebar.style.left = '0'; // Open sidebar
    document.body.style.marginLeft = '250px';
  }
}


//close month or bill generation process here start
function showBillDialog() {
  //here a dialog will be display, which will ask user following information
  //meterName_monthName:DateTime:Current Reading:Consumption:Amount
  //thsi info will stored in billStorage
  //a dialog will open have 4 inputs 3 are numbers and 1 is datetime
  //when user press submit buttons all info will saved in billStorage
  //after this closemonth method will be called
  //in closemonth method add this line, before copying currentmonth entries to nextmonth
  //add one entry first will be like this
  //datetime:currentReading:0
  //after this copy entries from currentmonth array to nextmonth array
  billDialog = document.getElementById("td5");
  billDialog.classList.add("confirm-dialog");
  billDialog.style.display = 'block';
  billDialog.innerHTML = "<center><h6>Month Closing<br><br>Bill Generation</h6></center>";
  billDialog.innerHTML += `<form id="addBillForm">
  <input type="date" id="billDate" required>
  <input type="number" id="currentReading" placeholder="Current Reading" required>
  <input type="number" id="consumption" placeholder="Consumption" required>
  <input type="number" id="amount" placeholder="Amount" required>
  <br><button type="submit" class="no-button">Submit</button>
  <br><button id="hidebilldialog" class="yes-button">Cancel</button>
  </form>`;
  document.getElementById("addBillForm").addEventListener("submit",saveBill);
  document.getElementById("hidebilldialog").onclick = function() {
    billDialog.classList.remove("confirm-dialog");
    billDialog.innerHTML = "";
  };
}


//Payment Dialog Start 
function showPaymentDialog() {
  billDialog = document.getElementById("td5");
  billDialog.classList.add("confirm-dialog");
  billDialog.style.display = 'block';
  billDialog.innerHTML = "<center><h6>Payment<br><br>Entry Form</h6></center>";
  billDialog.innerHTML += `<form id="addPaymentForm">
  <input type="date" id="billDate" required>
  <input type="number" id="currentReading" placeholder="Adnan" required>
  <input type="number" id="consumption" placeholder="Bhai" required>
  <input type="number" id="amount" placeholder="Zaki" required>
  <br><button id="sumbithide" type="submit" class="no-button">Submit</button>
  <br><button id="hidebilldialog" class="yes-button">Cancel</button>
  </form>`;
  document.getElementById("addPaymentForm").addEventListener("submit",savePayment);
  document.getElementById("hidebilldialog").onclick = function() {
    billDialog.classList.remove("confirm-dialog");
    billDialog.innerHTML = "";
  };
  document.getElementById("sumbithide").onclick = function() {
    billDialog.classList.remove("confirm-dialog");
    //billDialog.innerHTML = "";
  };
}
//Payment Dialog End Here


//Credit Card Dialog Start 23 Apr 2025
function viewCreditCard(totest) {
  const billContent = document.getElementById("content");
  billContent.innerHTML = ""; // Clear existing content
  let billsHTML2 = "";
  let tcurmonname = "";
  let ftot = 0;
  let atot = 0;
  let billDate = new Date();
  let atem = `<h2>Credit Card</h2><p>${formatDateTime(new Date())}</p><div class="wrapper">`;
  allMonths.forEach((monthName) => {
    //fetech bill information from allBills array
    //format of tid is CC_monthName
    let h = allBills.filter((m) => m.tid == "CC_" + monthName);
    let toto = 0, mvalue = 0 , jvalue = 0;
    if(h.length > 0) {
      billDate = h[0].billDate;
      mvalue = h[0].currentReading;
      jvalue = h[0].amount;
      atem += `
      <div class="box">
        <h1>${monthName}</h1><br>
        <h5>Due Date: ${formatDateTime(billDate,1)}</h5>
        <h6>Mohsin Bill: ${mvalue.toLocaleString()} & ${(100000-mvalue).toLocaleString()} remaining</h6> 
        <h6>Jahangir Bill: ${jvalue.toLocaleString()} & ${(95000-jvalue).toLocaleString()} remaining</h6> 
        <h5>Total Bill: ${(mvalue+jvalue).toLocaleString()}</h5>
        <h5>Total Remaining: ${((100000-mvalue)+(95000-jvalue)).toLocaleString()}</h5>
      </div>
    `;
    }
    else {
      billDate = new Date(billDate);
      billDate.setMonth(billDate.getMonth() + 1);
      //m
      atem += `<div class="box" onclick="showCCDialog('${monthName}')">
        <h1>${monthName}</h1><br>
        <h5>Due Date: ${formatDateTime(billDate,1)} P</h5>
        <h5>Mohsin Amount: N/A</h5> 
        <h5>Jahangir Amount: N/A</h5>
        <h5>Total Amount: N/A</h5>
      </div>`;
    }
    
  });
  atem += `</div>`;
  billContent.innerHTML = atem;
  generateGraph("CC",0,"n");
  totest == 1 ? hidesidebar() : null;
}

function showCCDialog(mname) {
  monthName = mname;
  //tid will be used for Credi Card Month i.e Jan 25, Feb 25..., will be pass mname
  //billDate will be used for due date
  //currentReading will be used for current bill amount for mohsin credit card
  //consumption will be used for current bill amount for jahangir credit card
  //when user will press credti card bill, it will show all months, then user will click on any month
  //then it will show this dialog
  billDialog = document.getElementById("td5");
  billDialog.classList.add("confirm-dialog");
  billDialog.style.display = 'block';
  billDialog.innerHTML = `<center><h4>Credit Card Billing for the month of ${mname}<br><br>Entry Form</h4></center>`;
  billDialog.innerHTML += `<form id="addCCForm">
  <input type="date" id="billDate" required>
  <input type="number" id="currentReading" placeholder="Mohsin Credit Card Amount" required>
  <input type="number" id="amount" placeholder="Jahangir Credit Card Amount" required>
  <br><button id="sumbithide" type="submit" class="no-button">Submit</button>
  <br><button id="hidebilldialog" class="yes-button">Cancel</button>
  </form>`;
  document.getElementById("addCCForm").addEventListener("submit",saveCCBill);
  document.getElementById("hidebilldialog").onclick = function() {
    billDialog.classList.remove("confirm-dialog");
    billDialog.innerHTML = "";
  };
  document.getElementById("sumbithide").onclick = function() {
    billDialog.classList.remove("confirm-dialog");
    //billDialog.innerHTML = "";
  };
}


function saveCCBill() {
  //consumption=total amount (mohsin credit card amount + jahangir credit card amount)
  //currentReading=mohsin credit card amount
  //amount=jahangir credit card amount
  //billDate=due date
  allBills = JSON.parse(localStorage.getItem(billStorage)) || [];
  billDate = document.getElementById("billDate").value;
  currentReading = parseFloat(document.getElementById("currentReading").value);
  amount = parseFloat(document.getElementById("amount").value);
  consumption = currentReading + amount;
  pname = "CC_" + monthName; //set on showCCDialog first line
  allBills.push({tid:pname,billDate:billDate,currentReading:currentReading,consumption:consumption,amount:amount});
  localStorage.setItem(billStorage, JSON.stringify(allBills));
  document.getElementById("td5").innerHTML = "";
  viewCreditCard();
}
//Credit Card Dialog End Here 23 Apr 2025

function addBill(mname,monname,index) {
  meterName = mname;
  monthName = monname; 
  tindex = index;
  showBillDialog();
}

function saveBill() {
  billDate = document.getElementById("billDate").value;
  billDate = billDate + "T15:00";
  console.log("after adding t15:00  " +  billDate);
  //billDate = new Date(billDate);
  //console.log("after new Date(billdate)" +  billDate);
  //billDate = billDate.toLocaleDateString();
  //console.log("after tolocaleDateString()" +  billDate);
  currentReading = parseFloat(document.getElementById("currentReading").value);
  consumption = parseFloat(document.getElementById("consumption").value);
  amount = parseFloat(document.getElementById("amount").value);
  // if (!billDate || isNaN(currentReading)) {
  //   alert("Please fill out all fields correctly.");
  //   return;
  // }
  let tmsg = "you have entered following bill information\n";
  tmsg += "bill Date" + billDate + "\nCurrent Reading" + currentReading;
  tmsg += "\nconsumption" + consumption + "\nAmount" + amount;
  //alert(tmsg);
  let mmname = meterName + "_" + monthName;
  if(JSON.stringify(allBills).includes(mmname)){
    alert("Bill already exists!");
    return 0;
  }
  if(closeEntries(meterName, monthName, tindex)) {
    allBills.push({tid:mmname,billDate:billDate,currentReading:currentReading,consumption:consumption,amount:amount});
    localStorage.setItem(billStorage, JSON.stringify(allBills));
  }
  //showMessageDialog(tmsg,"td6");
  //localStorage.setItem(billStorage, JSON.stringify(allBills));
  //return 1;
  //showMessageDialog(JSON.stringify(allBills),"td7");  
}



function showMessageDialog(hmesg,tdname) {
  //this method will be use to display messages to the user
  //it use <p id="td5"></p>
  //this is dedicated for displaying messages
  msgDialog = document.getElementById(tdname);
  msgDialog.classList.add("confirm-dialog");
  msgDialog.style.display = 'block';
  msgDialog.innerHTML = "<h5>"+hmesg+"</h5>";
  msgDialog.innerHTML += `<br><button onclick="hidemsgdialog('${tdname}')" class="yes-button">Close</button>`;
  // document.getElementById("hidemsgdialog_"+tdname).onclick = function() {
  //   msgDialog.classList.remove("confirm-dialog");
  //   msgDialog.innerHTML = "";
  // };
}

function hidemsgdialog(tdname){
  msgDialog = document.getElementById(tdname);
  msgDialog.classList.remove("confirm-dialog");
  msgDialog.style.display = 'none';
  msgDialog.innerHTML = "";
}

//24 may 2025
//comparision 
function analytics() {
  document.getElementById("tgraphs").innerHTML = "";
  document.getElementById("content").innerHTML = "";
  let meters = JSON.parse(localStorage.getItem(metersStorage)) || [];
  const billContent = document.getElementById("tgraphs");
  let billsHTML2 = "";
  let b  = "<table><tr><td>Meter</td><td>From</td><td>To</td><td>Compare</td></tr>";
  b  += "<tr><td><select id='selmet'>";
  meters.forEach((m) => {
    b += `<option>${m}</option>`;
  });
  b += "</select></td><td><select id='selmf'>";
  allMonths.forEach((m) => {
    b += `<option>${m}</option>`;
  });
  b += "</select></td><td><select id='selmt'>";
  allMonths.forEach((m) => {
    b += `<option>${m}</option>`;
  });
  b += "</select></td><td><button onclick='showal()'>Compare</button></td></tr></table>";
  //b += `<canvas id="ac" width="600" height="400"></canvas>`;
  // b += `<br><canvas id="ac2" width="600"  height="400"></canvas>`;
  //b += `<br><br><br><br>`;
  billsHTML2 = b;
  billContent.innerHTML = billsHTML2;
  hidesidebar();
}

function showsMonths2(){
  const content = document.getElementById("content");
  let a = "<table><tr><td id='fa'></td>";
  a += "<td id='fb'></td>";
  a += "<td id='fc'></td>";
  a += "<td id='fd'></td>";
  content.innerHTML = a;
  showMonths('fa');
  showMonths("fb");


}

//18 Apr 2025
//viewAmount Function
let mykey_billsHTML3 = "";
let mykey_gltablestr = "";
function viewAmount() {
  const billContent = document.getElementById("content");
  const gltable = document.getElementById("gltable");
  billContent.innerHTML = ""; // Clear existing content
  let billsHTML2 = "";
  let billsHTML3 = "";
  let gltablestr = "";
  let ftot = 0;
  let fftot = 0; //sum of all bills amount
  let atot = 0;
  let btot = 0;
  let ztot = 0;
  let billsHTML = `<h2>Amount</h2><p class='ptime'>${formatDateTime(new Date())}</p>`;
  billsHTML += "<div class='moamount'><table><tr style='background:Red'><th>Month</th><th>Total</th><th>Adnan</th><th>Bhai</th><th>Zaki</th></tr>";
  gltablestr += "<div class='moamount'><table><tr style='background:Red'><th>Month</th><th>Gas</th><th>KE1</th><th>KE2</th><th>Total</th><th>Head/3</th><th>Head/2</th></tr>";
  billsHTML3 = "<table class='moamount'><tr style='background:Red'><th>Month</th><th>Total</th><th>Head/3</th><th>Head/2</th></tr>";
  let tmleng = allMonths.length -2;
  allMonths.forEach((monthName,index) => {
    // console.log("this is allmonths index : " + index);
    // console.log("this is tmleng : " + tmleng);
    if(index<=tmleng) {
      billsHTML += "<tr><td>" + monthName + "</td>";
      billsHTML3 += "<tr><td>" + monthName + "</td>";
      gltablestr += "<tr><td>" + monthName + "</td>";
      let tota = 0;
      meters.forEach((m) => {
        //add filter to exclude CCM and CCJ these are credit card bills
        if (m.startsWith("CC")) return; 
        let a = m + "_" + monthName;
        let h = allBills.filter((mml) => mml.tid==a); 
        if(h.length > 0) {
          billsHTML2 += h[0].tid + " and Amount is " + h[0].amount.toLocaleString() + "<br>";
          tota = tota + h[0].amount;
          gltablestr += "<td>" + h[0].amount.toLocaleString() + "</td>";
        }
      })
      
      if(tota > 0) {
        gltablestr += "<td>"+tota.toLocaleString()+"</td>";
        gltablestr += "<td>"+(Math.round(tota/3)).toLocaleString()+"</td>";
        gltablestr += "<td>"+(Math.round(tota/2)).toLocaleString()+"</td>";
        gltablestr += "</tr>";
        billsHTML2 += "Total Amount " + monthName + " " + tota.toLocaleString() + "<br>";
        billsHTML2 += "Head/3 : " + (Math.round(tota/3)).toLocaleString() + "<br>";
        billsHTML2 += "Head/2 : " + (Math.round(tota/2)).toLocaleString() + "<br>";
        billsHTML2 += "______________<br>";
        let bbb = (Math.round(tota/3)).toLocaleString();
        ftot = ftot + Math.round(tota/3);
        fftot = tota + fftot;
        billsHTML += "<td>" + (Math.round(tota)).toLocaleString() + "</td><td>" + bbb + "</td><td>" + bbb + "</td><td>" + bbb + "</td></tr>";
        billsHTML3 += "<td>" + (Math.round(tota)).toLocaleString() + "</td><td>" + (Math.round(tota/3)).toLocaleString() + "</td><td>" + (Math.round(tota/2)).toLocaleString() + "</td></tr>";
      }
    }
  });
  billsHTML += "<tr style='background:Red'><th>Total Bill</th><th>"+ fftot.toLocaleString() +"</th><th>" + ftot.toLocaleString() + "<th>" + ftot.toLocaleString() + "</th><th>" + ftot.toLocaleString() + "</th></tr>";
  billsHTML += "<tr style='background:crimson'><th>Payment History</th></tr><tr style='background:Red'><th>Date</th><th></th><th>Adnan</th><th>Bhai</th><th>Zaki</th></tr>";


  //Here I will print Payment History 
  allBills.forEach((m) => {
    if(!m.tid.includes("_")) {
      billsHTML += "<tr><td>"+formatDateTime(m.billDate,1)+"</td><td></td>";
      billsHTML += "<td>" + m.currentReading.toLocaleString() + "</td>" ;
      billsHTML += "<td>" + m.consumption.toLocaleString() + "</td>" ;
      billsHTML += "<td>" + m.amount.toLocaleString() + "</td>" ;
      atot = atot + m.currentReading;
      btot = btot + m.consumption;
      ztot = ztot + m.amount;
    }
  });
  let fftot2 = Math.round(fftot/2);
  let fftot3 = Math.round(fftot/3);
  billsHTML += "<tr></tr>";
  billsHTML += "<tr style='background:Red'><th>Total Bill</th><th>"+ fftot.toLocaleString() +"</th><th>" + ftot.toLocaleString() + "<th>" + ftot.toLocaleString() + "</th><th>" + ftot.toLocaleString() + "</th></tr>";
  billsHTML += "<tr style='background:darkgreen'><th>Total Payment</th><th></th><th>" + (atot).toLocaleString() + "<th>" + (btot).toLocaleString() + "</th><th>" + (ztot).toLocaleString() + "</th></tr>";
  billsHTML += "<tr style='background:Black'><th>Balance</th><th></th><th>" + (ftot - atot).toLocaleString() + "<th>" + (ftot - btot).toLocaleString() + "</th><th>" + (ftot - ztot).toLocaleString() + "</th></tr>";
  billsHTML += "</table></div>";
  billsHTML3 += "<tr style='background:Red'><th>Total Bill</th><th>" + fftot.toLocaleString() + "<th>" + (fftot3).toLocaleString() + "</th><th>" + (fftot2).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:Black'><th>&nbsp;</th><th>&nbsp;<th>&nbsp;</th><th>&nbsp;</th></tr>";
  billsHTML3 += "<tr style='background:darkgreen'><th>Per</th><th>Person</th><th>Total</th><th>Bill/2</th><th></tr>";
  billsHTML3 += "<tr style='background:red'><th>Person</th><th>Payment</th><th>Head/2</th><th>Balance</th><th></tr>";
  billsHTML3 += "<tr style='background:green'><th>Adnan</th><th>" + (atot).toLocaleString() + "<th>" + (fftot2).toLocaleString() + "</th><th>" + (fftot2-atot).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:darkorange'><th>Zaki</th><th>" + (ztot).toLocaleString() + "<th>" + (fftot2).toLocaleString() + "</th><th>" + (fftot2-ztot).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:organge'><th>Total</th><th>" + (atot+ztot).toLocaleString() + "<th>" + (fftot).toLocaleString() + "</th><th>" + ((fftot2-atot) + (fftot2-ztot)).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:Black'><th>&nbsp;</th><th>&nbsp;<th>&nbsp;</th><th>&nbsp;</th></tr>";
  billsHTML3 += "<tr style='background:Black'><th>&nbsp;</th><th>&nbsp;<th>&nbsp;</th><th>&nbsp;</th></tr>";
  billsHTML3 += "<tr style='background:blue'><th>Per</th><th>Person</th><th>Total</th><th>Bill/3</th><th></tr>";
  billsHTML3 += "<tr style='background:red'><th>Person</th><th>Payment</th><th>Head/3</th><th>Balance</th><th></tr>";
  billsHTML3 += "<tr style='background:darkcyan'><th>Bhai</th><th>" + (btot).toLocaleString() + "<th>" + (fftot3).toLocaleString() + "</th><th>" + (fftot3-btot).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:green'><th>Adnan</th><th>" + (atot).toLocaleString() + "<th>" + (fftot3).toLocaleString() + "</th><th>" + (fftot3-atot).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:darkorange'><th>Zaki</th><th>" + (ztot).toLocaleString() + "<th>" + (fftot3).toLocaleString() + "</th><th>" + (fftot3-ztot).toLocaleString() + "</th></tr>";
  billsHTML3 += "<tr style='background:organge'><th>Total</th><th>" + (btot+atot+ztot).toLocaleString() + "<th>" + (fftot).toLocaleString() + "</th><th>" + ((fftot3-btot) + (fftot3-atot) + (fftot3-ztot)).toLocaleString() + "</th></tr>";
  billsHTML3 += "</table>";
  // billsHTML3 += "<button onclick='html2pdf("+billsHTML3+")'>Convert to PDF</button>";
  billsHTML += `<br><div class='buttons'><button class='yes-button' onclick='showPaymentDialog()'>Add Payment</button></div>`;
  billsHTML = billsHTML + "<br>" + billsHTML2 + "<br>" + billsHTML3;
  mykey_billsHTML3 = billsHTML3; 
  mykey_gltablestr = gltablestr; 
  billContent.innerHTML = billsHTML + `<button onclick="convertToPDF('1')">Convert to PDF</button><br><br><br>`;
  //billContent3.innerHTML = billsHTML3;
  // Set a string value   "deleteBill('${bill.tid}')"
  //localStorage.setItem("myKey", billsHTML3);
  gltable.innerHTML = gltablestr + `<button onclick="convertToPDF('2')">Convert to PDF</button><br><br><br>`;

}

function convertToPDF(haa) {
  //haa is used to identify which table to convert to pdf
  switch(haa) {
    case '1':
      localStorage.setItem("myKey", mykey_billsHTML3);
      break;
    case '2':
      localStorage.setItem("myKey",mykey_billsHTML3 + "<br><hr><br>" + mykey_gltablestr);
      break;
    case '3':
      localStorage.setItem("myKey", mykey_bnm);
      break;
    default:
      console.error("Invalid option for PDF conversion");
      return;
  }
  // localStorage.setItem("myKey", haa);
  window.open('h.html', '_blank');
  //html2pdf(element);
}

//End 18 Apr 2025
//bill managemnt section start here
function viewBills() {
  const billContent = document.getElementById("content");
  billContent.innerHTML = ""; // Clear existing content
  let billsHTML = "<h2>Bills</h2>" + formatDateTime(new Date());
  if (allBills.length === 0) {
      billsHTML += "<p>No bills available.</p>";
  } else {
      billsHTML += "<table><thead><tr><th>Meter_Month</th><th>Bill Date</th><th>Reading</th><th>Consumption</th><th>Amount</th><th>Action</th></tr></thead><tbody>";
      allBills.forEach((bill, index) => {
          billsHTML += `<tr>
                          <td>${bill.tid}</td>
                          <td>${formatDateTime(bill.billDate,1)}</td>
                          <td>${bill.currentReading}</td>
                          <td>${bill.consumption}</td>
                          <td>${bill.amount}</td>
                          <td><button onclick="deleteBill('${bill.tid}')">🗑️ Delete</button></td>
                         </tr>`;
      });
      billsHTML += "</tbody></table>";
  }
  billContent.innerHTML = billsHTML;
}


function savePayment() {
  allBills = JSON.parse(localStorage.getItem(billStorage)) || [];
  amount = parseFloat(document.getElementById("amount").value);
  //pname = document.getElementById("pname").value;
  billDate = document.getElementById("billDate").value;
  currentReading = parseFloat(document.getElementById("currentReading").value);
  consumption = parseFloat(document.getElementById("consumption").value);
  pname = "PMT";
  let aa = new Date(billDate).toDateString();
  //console.log(aa);
  aa = aa.replaceAll(" ","");
  //console.log(aa);
  aa = aa.substring(3);
  //console.log(aa);
  pname = pname + aa;
  allBills.push({tid:pname,billDate:billDate,currentReading:currentReading,consumption:consumption,amount:amount});
  //allBills.push({tid:pname,billDate:billDate,amount:amount});
  localStorage.setItem(billStorage, JSON.stringify(allBills));
  document.getElementById("td5").innerHTML = "";
  viewAmount();
}

function deleteAllBills() {
if (confirm("Are you sure you want to delete ALL bills?")) {
  localStorage.removeItem(billStorage);
  allBills = [];
  localStorage.setItem(billStorage, JSON.stringify(allBills));
  viewBills();  // Refresh the bill display
}
}


function deleteBill(billTid) {
  if (confirm("Are you sure you want to delete this bill?")) {
      allBills = allBills.filter(bill => bill.tid !== billTid);
      localStorage.setItem(billStorage, JSON.stringify(allBills));
      viewBills(); // Refresh the bill display
  }
}

//bill management section end here 12 Feb 25 3:30 AM
//from perplexcity ai code
//08 Mar 2025 start here calculate amount of conusmed unit
function calculateAmount(consumedUnits) {
  let costPerUnit;
  
  if (consumedUnits >= 0 && consumedUnits <= 100) {
      costPerUnit = 26.8;
  } else if (consumedUnits <= 200) {
      costPerUnit = 33.3;
  } else if (consumedUnits <= 300) {
      costPerUnit = 39.01;
  } else if (consumedUnits <= 400) {
      costPerUnit = 43.9;
  } else if (consumedUnits <= 500) {
      costPerUnit = 48.6;
  } else if (consumedUnits <= 600) {
      costPerUnit = 53.1;
  }
  else {
      console.log("Units out of range");
      return 0;
  }

  let x = consumedUnits * costPerUnit; // Initial cost
  let y = (1.5/100) * x; // 1.5 times x
  let z = x + y; // Sum of x and y
  let a = 0.18 * z; // 18% of z
  let finalCost = x + y + a; // Final cost
  finalCost = Math.round(finalCost);
  return finalCost.toLocaleString();

}

// Example usage:
//calculateAmount(150);
//08 Mar 2025 end here calculate amount of conusmed unit


//11 Mar 25 3:30 AM start here summary weekly consumption 
function showwc(a,b) {
  let c = a + "_" + b;
  const data = JSON.parse(localStorage.getItem(c)) || [];
  // Sort data by date
  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  // Get the start date
  const startDate = data[0] ? new Date(data[0].date) : null;
  const weeklyData = [];
  let currentWeek = [];
  let lastWeekEndUnits = null;
  
  if (startDate) {
      data.forEach((entry, index) => {
          const entryDate = new Date(entry.date);
          const weekNumber = getWeekNumber(startDate, entryDate);
          if (!weeklyData[weekNumber]) {
              // Start a new week with the last week's ending units as starting units
              weeklyData[weekNumber] = { week: weekNumber + 1, records: [], startUnits: lastWeekEndUnits };
          }
          weeklyData[weekNumber].records.push(entry);
          lastWeekEndUnits = entry.units; // Update last week's end units
      });
  
      // Calculate weekly consumption
      weeklyData.forEach((week, index) => {
          if (week.records.length > 0) {
              const firstUnits = week.startUnits !== null ? week.startUnits : week.records[0].units;
              const lastUnits = week.records[week.records.length - 1].units;
              week.totalConsumption = lastUnits - firstUnits;
              week.startUnits = firstUnits;
          }
      });
  }
  
  const summaryTable = document.getElementById("weeklySummary");
  summaryTable.innerHTML = "";
  const detailsContainer = document.getElementById("weeklyDetails");
  detailsContainer.innerHTML = "";
  let totalWeeklyConsumption = 0;
  let i = 0;
  document.getElementById("tgraphs").innerHTML = "";
  //let graphContainer2 = document.getElementById("tgraph3");
  //let graphHTML = "";
  //let graphHTML2 = "";

  
  weeklyData.forEach((week, index) => {
      const row = document.createElement("tr");
      let barHeight = week.totalConsumption + 20;
      totalWeeklyConsumption += week.totalConsumption;
      row.innerHTML = `
          <td>Week ${week.week}</td>
          <td><div class="graph-bar" style="width:${barHeight}px; background-color:${mncolors[i % mncolors.length]};">${week.totalConsumption}</div></td>
          <td><span class="toggle-btn" onclick="toggleDetails(${index})">View Details</span></td>
      `;
      graphHTML += `
        <div class="graph-bar" style="height:${barHeight}px; background-color:${mncolors[i % mncolors.length]};">
          <span class="bar-label2">${week.week}</span>
          <span class="bar-label">${week.totalConsumption}</span>
        </div>`;
      graphHTML2 += `
        <div class="graph-bar" style="height:${barHeight}px; background-color:${mncolors[i % mncolors.length]};">
          <span class="bar-label2">${week.week}</span>
          <span class="bar-label">${calculateAmount(week.totalConsumption)}</span>
        </div>`;
      summaryTable.appendChild(row);
      i = i + 1;
      document.getElementById("twc").innerHTML = `Total Weekly Consumption: ${totalWeeklyConsumption}`;

  
      // Weekly detailed table
      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("details");
      detailsDiv.id = `details-${index}`;
      detailsDiv.innerHTML = `
          <h3>Details for Week ${week.week}</h3>
          <table>
              <thead>
                  <tr>
                      <th>Date</th>
                      <th>Units</th>
                  </tr>
              </thead>
              <tbody>
                  ${week.records.map(entry => `
                      <tr>
                          <td>${new Date(entry.date).toLocaleDateString()}</td>
                          <td>${entry.units}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      `;
      detailsContainer.appendChild(detailsDiv);
  });
  graphContainer.innerHTML = graphHTML;
  graphContainer2.innerHTML = graphHTML2;
  
}
function getWeekNumber(startDate, currentDate) {
  const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in a day
  return Math.floor((new Date(currentDate) - new Date(startDate)) / (7 * oneDay));
}
function toggleDetails(index) {
  const details = document.getElementById(`details-${index}`);
  details.style.display = (details.style.display === "none" || details.style.display === "") ? "block" : "none";
}
//11 Mar 25 3:30 AM end here summary weekly consumption  