(function () {
    "use strict";
    var form = document.getElementById("project-form");
    if (!form) return;
    var fieldHost = document.getElementById("project-fields");
    var unitSelect = document.getElementById("project-units");
    var currentProject = "patio";
    var currentUnit = "imperial";
    var latestPhases = [];
    var savedKey = "buildestimate-saved-projects-v1";
    var definitions = {
        patio: [
            ["length","Patio length","length",16],["width","Patio width","length",12],["paverLength","Paver length","small",8],["paverWidth","Paver width","small",4],["baseDepth","Compacted base depth","small",4],["waste","Cuts / extra","percent",10]
        ],
        landscape: [
            ["length","Bed length","length",30],["width","Bed width","length",8],["mulchDepth","Mulch depth","small",3],["soilDepth","Topsoil amendment depth","small",1],["edgingPiece","Edging piece length","length",8],["waste","Extra material","percent",10]
        ],
        sod: [
            ["length","Lawn length","length",50],["width","Lawn width","length",30],["soilDepth","Topsoil depth","small",2],["rollCoverage","Coverage per roll","area",10],["waste","Trimming / extra","percent",5]
        ],
        fence: [
            ["length","Fence length","length",120],["panelWidth","Panel width","length",8],["bagsPerPost","Concrete bags per post","count",2],["gates","Gate openings","count",1],["waste","Extra material","percent",5]
        ],
        room: [
            ["length","Room length","length",14],["width","Room width","length",12],["height","Wall height","length",8],["doors","Doors","count",1],["windows","Windows","count",2],["coats","Paint coats","count",2],["waste","Flooring / trim extra","percent",10]
        ]
    };
    var names = { patio:"Paver patio", landscape:"Landscape refresh", sod:"New sod lawn", fence:"Privacy fence", room:"Room refresh" };

    function format(value, digits) { return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits == null ? 1 : digits }); }
    function round(value) { return Math.ceil(value - Math.max(1, Math.abs(value)) * 1e-12); }
    function fieldValue(name) { var field = form.elements.namedItem(name); var value = Number(field && field.value); return Number.isFinite(value) ? value : 0; }
    function toFeet(value, type) {
        if (currentUnit === "imperial") return type === "small" ? value / 12 : type === "area" ? value : value;
        if (type === "small") return value / 30.48;
        if (type === "area") return value / 0.092903;
        return value / 0.3048;
    }
    function labelFor(type) { if (type === "percent") return "%"; if (type === "count") return ""; if (type === "area") return currentUnit === "metric" ? "m²" : "ft²"; if (type === "small") return currentUnit === "metric" ? "cm" : "in"; return currentUnit === "metric" ? "m" : "ft"; }
    function area(squareFeet) { return currentUnit === "metric" ? format(squareFeet * 0.092903) + " m²" : format(squareFeet, 0) + " ft²"; }
    function length(feet) { return currentUnit === "metric" ? format(feet * 0.3048) + " m" : format(feet) + " ft"; }
    function volume(cubicFeet) { return currentUnit === "metric" ? format(cubicFeet * 0.0283168) + " m³" : format(cubicFeet / 27) + " yd³"; }
    function item(name, quantity, query, method) { return { name:name, quantity:quantity, query:query, method:method }; }

    function csvCell(value) { var text=value==null?'':String(value);if(typeof value==='string'&&/^[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'; }
    function downloadCsv(filename,rows){var csv='\ufeff'+rows.map(function(row){return row.map(csvCell).join(',');}).join('\r\n');var url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));var link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
    function shoppingUrls(query){var encoded=encodeURIComponent(query);return{homeDepot:'https://www.homedepot.com/s/'+encoded,lowes:'https://www.lowes.com/search?searchTerm='+encoded,local:'https://www.google.com/search?q='+encodeURIComponent(query+' supplier near me')};}
    function splitQuantity(quantity){if(typeof quantity==='number')return{value:quantity,unit:''};var match=String(quantity).match(/^([\d,.]+)\s*(.*)$/);return match?{value:Number(match[1].replace(/,/g,'')),unit:match[2]}:{value:quantity,unit:''};}
    function exportProjectCsv(){var rows=[["Record Type","Phase","Item","Value / Quantity","Unit","Basis","Unit Cost","Extended Cost","Home Depot","Lowe's","Local Supplier"]];rows.push(['Project','','Name',document.getElementById('project-name').value,'','','','','','','']);rows.push(['Project','','Type',names[currentProject],'','','','','','','']);rows.push(['Project','','Exported',new Date().toISOString(),'','','','','','','']);definitions[currentProject].forEach(function(definition){rows.push(['Dimension / assumption','',definition[1],fieldValue(definition[0]),labelFor(definition[2]),definition[0],'','','','','']);});latestPhases.forEach(function(phase){phase.rows.forEach(function(material){var urls=shoppingUrls(material.query),quantity=splitQuantity(material.quantity);rows.push(['Material',phase.name,material.name,quantity.value,quantity.unit,material.method,'','',urls.homeDepot,urls.lowes,urls.local]);});});rows.push(['Note','','Costs','Enter quoted unit costs in Excel','','Extended cost is intentionally blank until a supplier price is known.','','','','','']);downloadCsv(currentProject+'-project-materials.csv',rows);}
    function updateUrl(){if(!history.replaceState)return;var params=new URLSearchParams();params.set('project',currentProject);params.set('units',currentUnit);params.set('projectName',document.getElementById('project-name').value);definitions[currentProject].forEach(function(definition){params.set(definition[0],fieldValue(definition[0]));});history.replaceState({},'',location.pathname+'?'+params.toString());}
    function shareCurrent(button){var data={title:document.getElementById('project-result-title').textContent+' | BuildEstimate',text:document.getElementById('project-summary').textContent,url:location.href};if(navigator.share){navigator.share(data).catch(function(){});return;}navigator.clipboard.writeText(data.url).then(function(){var previous=button.textContent;button.textContent='Link copied';setTimeout(function(){button.textContent=previous;},1500);}).catch(function(){button.textContent='Copy unavailable';});}

    function renderFields(values) {
        fieldHost.innerHTML = "";
        definitions[currentProject].forEach(function (definition) {
            var id = definition[0], label = definition[1], type = definition[2];
            var wrapper = document.createElement("div");
            wrapper.className = "field";
            var unit = labelFor(type);
            wrapper.innerHTML = '<label for="project-' + id + '">' + label + (unit ? ' (' + unit + ')' : '') + '</label><input id="project-' + id + '" name="' + id + '" type="number" min="0" step="any">';
            var base = values && values[id] != null ? values[id] : definition[3] * (currentUnit === "metric" ? (type === "small" ? 2.54 : type === "length" ? 0.3048 : type === "area" ? 0.092903 : 1) : 1);
            wrapper.querySelector("input").value = Number(base.toFixed ? base.toFixed(3) : base);
            fieldHost.appendChild(wrapper);
        });
    }

    function calculate() {
        var lengthFeet = toFeet(fieldValue("length"), "length");
        var widthFeet = toFeet(fieldValue("width"), "length");
        var projectArea = lengthFeet * widthFeet;
        var waste = Math.max(0, fieldValue("waste")) / 100;
        var phases = [];
        if (currentProject === "patio") {
            var paverLength = toFeet(fieldValue("paverLength"), "small");
            var paverWidth = toFeet(fieldValue("paverWidth"), "small");
            var baseDepth = toFeet(fieldValue("baseDepth"), "small");
            phases = [
                {name:"Layout and excavation",rows:[item("Finished patio area",area(projectArea),"landscape marking paint","Measured rectangle"),item("Excavation footprint",area(projectArea*1.05),"landscape fabric geotextile","Includes working edge")]},
                {name:"Base and bedding",rows:[item("Compacted aggregate base",volume(projectArea*baseDepth*(1+waste)),"paver base gravel","Entered compacted depth plus allowance"),item("Bedding sand",volume(projectArea/12*(1+waste)),"paver bedding sand","Approximate 1-inch bed"),item("Edge restraint",length(2*(lengthFeet+widthFeet)*(1+waste)),"paver edge restraint","Perimeter plus allowance")]},
                {name:"Finish",rows:[item("Pavers",round(projectArea/(paverLength*paverWidth)*(1+waste)),"patio pavers " + fieldValue("paverLength") + " x " + fieldValue("paverWidth") + " " + labelFor("small"),"Area ÷ paver face plus allowance"),item("Polymeric joint sand",round(projectArea/40),"polymeric paver sand","Planning rate of one bag per 40 ft²")]}
            ];
        } else if (currentProject === "landscape") {
            var mulchDepth = toFeet(fieldValue("mulchDepth"), "small");
            var soilDepth = toFeet(fieldValue("soilDepth"), "small");
            var edgingPiece = toFeet(fieldValue("edgingPiece"), "length");
            var perimeter = 2*(lengthFeet+widthFeet);
            phases = [{name:"Preparation",rows:[item("Landscape fabric",area(projectArea*(1+waste)),"landscape fabric","Bed area plus overlaps"),item("Topsoil amendment",volume(projectArea*soilDepth*(1+waste)),"topsoil bags","Entered amendment depth")]},{name:"Finish",rows:[item("Mulch",volume(projectArea*mulchDepth*(1+waste)),"mulch bags","Entered depth plus allowance"),item("2 ft³ mulch bags",round(projectArea*mulchDepth*(1+waste)/2),"2 cu ft mulch","Bagged alternative"),item("Landscape edging",round(perimeter*(1+waste)/edgingPiece),"landscape edging " + fieldValue("edgingPiece") + " " + labelFor("length"),"Perimeter ÷ piece length")] }];
        } else if (currentProject === "sod") {
            var sodArea = projectArea*(1+waste);
            var topsoilDepth = toFeet(fieldValue("soilDepth"), "small");
            var rollCoverage = toFeet(fieldValue("rollCoverage"), "area");
            phases = [{name:"Soil preparation",rows:[item("Topsoil",volume(projectArea*topsoilDepth*(1+waste)),"screened topsoil","Entered depth plus allowance"),item("Starter fertilizer",round(projectArea/5000),"lawn starter fertilizer","One planning bag per 5,000 ft²")]},{name:"Sod installation",rows:[item("Sod coverage",area(sodArea),"fresh sod","Area plus trimming allowance"),item("Sod rolls",round(sodArea/rollCoverage),"sod rolls " + fieldValue("rollCoverage") + " " + labelFor("area") + " per roll","Order coverage ÷ entered roll coverage")]}];
        } else if (currentProject === "fence") {
            var panelWidth = toFeet(fieldValue("panelWidth"), "length");
            var panels = round(lengthFeet/panelWidth*(1+waste));
            var posts = panels+1+round(fieldValue("gates"));
            phases = [{name:"Layout and structure",rows:[item("Fence panels",panels,"privacy fence panels " + fieldValue("panelWidth") + " " + labelFor("length"),"Fence length ÷ panel width plus allowance"),item("Fence posts",posts,"pressure treated fence posts","One more than panels plus gate posts"),item("Concrete",round(posts*fieldValue("bagsPerPost")),"fast setting concrete bags","Entered bags per post")]},{name:"Hardware",rows:[item("Post caps",posts,"fence post caps","One per post"),item("Exterior screw boxes",round(panels/8)+1,"exterior deck screws","Planning allowance"),item("Gate hardware sets",round(fieldValue("gates")),"fence gate hardware kit","One per gate opening")]}];
            projectArea = lengthFeet;
        } else {
            var wallArea = Math.max(0,2*(lengthFeet+widthFeet)*toFeet(fieldValue("height"),"length")-fieldValue("doors")*21-fieldValue("windows")*15);
            var floorArea = lengthFeet*widthFeet;
            phases = [{name:"Walls",rows:[item("Interior paint",round(wallArea*fieldValue("coats")/350),"interior wall paint gallon","Net wall area × coats ÷ 350"),item("Primer",round(wallArea/350),"interior primer gallon","One planning coat"),item("Painter tape",round((2*(lengthFeet+widthFeet))/60),"painter tape","Perimeter allowance")]},{name:"Floor and trim",rows:[item("Flooring",area(floorArea*(1+waste)),"flooring","Floor area plus allowance"),item("Underlayment",area(floorArea*(1+waste)),"flooring underlayment","Matches flooring order area"),item("Baseboard",length((2*(lengthFeet+widthFeet)-fieldValue("doors")*3)*(1+waste)),"baseboard trim","Perimeter less doors plus allowance")]}];
            projectArea=floorArea;
        }
        return { phases:phases, area:projectArea, items:phases.reduce(function(sum,phase){return sum+phase.rows.length;},0) };
    }

    function shopLinks(query) { var encoded=encodeURIComponent(query); return '<div class="shop-links"><a target="_blank" rel="noopener noreferrer sponsored" href="' + window.amazonSearch(query).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '">Search Amazon ↗</a><a target="_blank" rel="nofollow noopener" href="https://www.homedepot.com/s/'+encoded+'">Home Depot ↗</a><a target="_blank" rel="nofollow noopener" href="https://www.lowes.com/search?searchTerm='+encoded+'">Lowe\'s ↗</a><a target="_blank" rel="nofollow noopener" href="https://www.google.com/search?q='+encodeURIComponent(query+' supplier near me')+'">Local ↗</a><a target="_blank" rel="nofollow noopener noreferrer" href="https://www.walmart.com/search?q=' + encoded + '">Search Walmart ↗</a></div>'; }
    function renderOutput() {
        var result=calculate(); latestPhases=result.phases;
        var title=document.getElementById("project-name").value.trim() || names[currentProject];
        document.getElementById("project-result-title").textContent=title;
        document.getElementById("project-summary").textContent=names[currentProject]+" · quantities update with your dimensions";
        document.getElementById("project-stats").innerHTML='<div class="stat-card"><strong>'+result.items+'</strong>Material lines</div><div class="stat-card"><strong>'+result.phases.length+'</strong>Project phases</div><div class="stat-card"><strong>'+definitions[currentProject].length+'</strong>Assumptions</div><div class="stat-card"><strong>5</strong>Buying options</div>';
        document.getElementById("project-bom").innerHTML=result.phases.map(function(phase){return '<details class="bom-phase" open><summary>'+phase.name+'</summary><table class="bom-table"><thead><tr><th>Material</th><th>Quantity</th><th>Basis</th><th>Where to buy</th></tr></thead><tbody>'+phase.rows.map(function(row){return '<tr><td>'+row.name+'</td><td class="bom-quantity">'+row.quantity+'</td><td>'+row.method+'</td><td>'+shopLinks(row.query)+'</td></tr>';}).join('')+'</tbody></table></details>';}).join('');
        updateUrl();
    }

    function readSaved() { try { return JSON.parse(localStorage.getItem(savedKey)) || []; } catch(error) { return []; } }
    function renderSaved() { var host=document.getElementById("saved-project-list"), saved=readSaved(); if(!saved.length){host.innerHTML='<p class="planner-muted">No saved projects yet.</p>';return;} host.innerHTML=''; saved.forEach(function(entry,index){var item=document.createElement('div');item.className='saved-project-item';var label=document.createElement('span');label.textContent=entry.name+' · '+names[entry.type];var button=document.createElement('button');button.type='button';button.textContent='Load';button.addEventListener('click',function(){loadProject(entry);});item.append(label,button);host.appendChild(item);}); }
    function snapshot() { var values={}; definitions[currentProject].forEach(function(definition){values[definition[0]]=fieldValue(definition[0]);}); return {name:document.getElementById('project-name').value||names[currentProject],type:currentProject,units:currentUnit,values:values}; }
    function loadProject(entry) { currentProject=entry.type; currentUnit=entry.units||'imperial'; unitSelect.value=currentUnit; document.getElementById('project-name').value=entry.name; document.querySelectorAll('[data-project]').forEach(function(button){button.classList.toggle('is-active',button.dataset.project===currentProject);}); renderFields(entry.values); renderOutput(); }
    document.querySelectorAll('[data-project]').forEach(function(button){button.addEventListener('click',function(){currentProject=button.dataset.project;document.querySelectorAll('[data-project]').forEach(function(other){other.classList.toggle('is-active',other===button);});document.getElementById('project-name').value=names[currentProject];renderFields();renderOutput();});});
    unitSelect.addEventListener('change',function(){var next=unitSelect.value;var values={};definitions[currentProject].forEach(function(definition){var value=fieldValue(definition[0]),type=definition[2],factor=1;if(next==='metric'&&currentUnit==='imperial')factor=type==='small'?2.54:type==='length'?0.3048:type==='area'?0.092903:1;if(next==='imperial'&&currentUnit==='metric')factor=type==='small'?1/2.54:type==='length'?1/0.3048:type==='area'?1/0.092903:1;values[definition[0]]=value*factor;});currentUnit=next;renderFields(values);renderOutput();});
    form.addEventListener('input',function(event){if(event.target!==unitSelect)renderOutput();});
    document.getElementById('save-project').addEventListener('click',function(){var saved=readSaved();saved.unshift(snapshot());saved=saved.slice(0,8);try{localStorage.setItem(savedKey,JSON.stringify(saved));this.textContent='Saved';setTimeout(function(){document.getElementById('save-project').textContent='Save on this device';},1200);}catch(error){this.textContent='Storage unavailable';}renderSaved();});
    document.getElementById('project-print').addEventListener('click',function(){window.print();});
    document.getElementById('project-export').addEventListener('click',exportProjectCsv);
    document.getElementById('project-share').addEventListener('click',function(){shareCurrent(this);});
    document.getElementById('project-copy').addEventListener('click',function(){var lines=[document.getElementById('project-result-title').textContent];latestPhases.forEach(function(phase){lines.push('',phase.name);phase.rows.forEach(function(row){lines.push('- '+row.name+': '+row.quantity);});});navigator.clipboard.writeText(lines.join('\n')).then(function(){this.textContent='Copied';}.bind(this)).catch(function(){this.textContent='Copy unavailable';}.bind(this));});
    var params=new URLSearchParams(location.search),requestedProject=params.get('project');
    if(definitions[requestedProject])currentProject=requestedProject;
    currentUnit=params.get('units')==='metric'?'metric':'imperial';unitSelect.value=currentUnit;
    document.querySelectorAll('[data-project]').forEach(function(button){button.classList.toggle('is-active',button.dataset.project===currentProject);});
    var sharedValues={};definitions[currentProject].forEach(function(definition){if(params.has(definition[0]))sharedValues[definition[0]]=Number(params.get(definition[0]));});
    document.getElementById('project-name').value=params.get('projectName')||names[currentProject];
    renderFields(sharedValues);renderOutput();renderSaved();
}());
