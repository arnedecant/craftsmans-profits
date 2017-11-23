const items = [
	{
		id: '124461',
	    name: 'Demonsteel Bar',
	    ppu: '75.00',
	    reagents: [
	        {
	        	id: '123918',
	            name: 'Leystone Ore',
	            ppu: '8.06',
	            amount: '1',
	            total: '8.06'
	        },
	        {
	        	id: '123919',
	            name: 'Felslate',
	            ppu: '21.32',
	            amount: '2',
	            total: '42.64'
	        }
	    ],
	    reagentsTotal: '50.70',
	    profit: '24.30'
	},
	{
		id: '123956',
	    name: 'Leystone Hoofplates',
	    ppu: '7663.00',
	    reagents: [
	        {
	        	id: '123918',
	            name: 'Leystone Ore',
	            ppu: '8.06',
	            amount: '25',
	            total: '201.50'
	        }
	    ],
	    reagentsTotal: '201.50',
	    profit: '797.50'
	}
];

let global = {
	key: 'cqb2mczuev8r8b8bgw6qzyhznpcwvxg3',
	api: {
		auctions: '/wow/auction/data/{{realm}}',
		item: '/wow/item/{{id}}',
		realms: '/data/wow/realm/'
	},
	templates: {
		item: null,
		itemdummy: null,
		itemlist: null
	},
	settings: {
		timestamp: new Date(localStorage.getItem('timestamp')),
		items: localStorage.getItem('items') || [],
		realm: localStorage.getItem('realm') || 'Stormrage',
		locale: localStorage.getItem('locale') || 'en_GB',
		namespace: localStorage.getItem('namespace') || 'dynamic-eu',
		auctions: JSON.parse(localStorage.getItem('auctions')) || []
	},
	data: {
		auctions: null,
		realms: localStorage.getItem('realms'),
	}
}

jQuery(document).ready(function($){
	global.settings.items = items;

	init();
});

function init() {
	global.templates.item = Handlebars.getTemplate('item');
	global.templates.itemdummy = Handlebars.getTemplate('itemdummy');

	renderItems(global.settings.items);

	initTriggers();
	initSettings();
}

function initTriggers() {
	const buttons = document.querySelectorAll('a[data-trigger], button[data-trigger]');

	for (let i = 0, button; button = buttons[i]; i++) {
		button.addEventListener('click', function(e) {
			let trigger = button.dataset.trigger,
				target = button.dataset.target;

			let element = document.querySelector('[data-' + trigger + '="' + target + '"]');

			let closeButtons = element.querySelectorAll('.close'),
				forms = element.querySelectorAll('form');

			element.classList.add('toggled');

			document.addEventListener('keyup', function(e) { 
				let key = e.keyCode || e.which;
				if (key === 27) element.classList.remove('toggled');
			});

			for (let i = 0, closeButton; closeButton = closeButtons[i]; i++) {
				closeButton.addEventListener('click', function(e) {
					element.classList.remove('toggled');
				});
			}

			for (let i = 0, form; form = forms[i]; i++) {
				form.addEventListener('submit', function(e) {
					element.classList.remove('toggled');
				});
			}
		});
	}
}

function initSettings() {
	let form = document.querySelector('form.settings'),
		realm = document.querySelector('form.settings #realm'),
		locale = document.querySelector('form.settings #locale')

	realm.value = global.settings.realm;
	document.querySelector('form.settings').addEventListener('submit', function(e) {
		e.preventDefault();
		updateSetting('realm', realm.value);
		updateSetting('locale', locale.options[locale.selectedIndex].value);
	});
}

function updateSetting(key, value, toJSON = false) {
	global.settings[key] = value;
	if (toJSON) value = JSON.stringify(value);
	localStorage.setItem(key, value);
}

function initItemEventListeners() {
	const clickEvents = [
		{element: 'article.item.dummy > button', callback: addNewItem},
	];

	for (let i = 0, ce; ce = clickEvents[i]; i++) {
		let element = document.querySelector(ce.element);

		if (element) {
			element.removeEventListener('click', ce.callback);
			element.addEventListener('click', ce.callback);
		}
	}
}

function addNewItem(e) {
	let id = prompt('Please enter the item ID', '124461');
	getItem(id);
}

function getAuctions(realm = global.settings.realm, onSuccess = null) {
	$.ajax({
        url: getRequestUrl(global.api.auctions, {realm: realm}),
        data: {
        	locale: global.locale,
        	apikey: global.key,
        },
        success: function(data) {
        	if (!data.files[0].url) {
        		alert('An error has occured.');
        		return;
        	}

        	var newurl = data.files[0].url;
        	timestamp = new Date(data.files[0].lastModified);
        	localStorage.setItem('timestamp', data.files[0].lastModified);

        	if (window.location.href.includes('https')) {
        		var newurl = newurl.replace('http://', 'https://');
        	}

        	$.getJSON('https://whateverorigin.herokuapp.com/get?url=' + encodeURIComponent(newurl) + '&callback=?', function(data){
        		global.data.auctions = data.contents.auctions;
        		if (onSuccess) invokeFunction(onSuccess.function, onSuccess.params);
        	});
        }
    });
}

function getItem(id) {
	if (!id) return;

	if (!global.data.auctions) {
		getAuctions(global.settings.realm, {
			function: 'getItem',
			params: [id]
		});

		return;
	}

	$.ajax({
        url: getRequestUrl(global.api.item, {id: id}),
        data: {
        	locale: global.settings.locale,
        	apikey: global.key
        },
        success: function(data) {
        	const item = data;
        	let itemAuctions = [];

    		for (let i = 0, auction; auction = global.data.auctions[i]; i++) {
        		if (auction.item == item.id) {
        			itemAuctions.push(auction);
        		}
        	}

        	global.settings.auctions = global.settings.auctions.concat(itemAuctions);
        	localStorage.setItem('auctions', JSON.stringify(global.settings.auctions));

        	let lowestPPU = 0;
        	for (let i = 0, auction; auction = itemAuctions[i]; i++) {
        		let ppu = auction.buyout / auction.quantity;
        		if (lowestPPU == 0 || lowestPPU > ppu) lowestPPU = ppu;
        	}

        	lowestPPU = lowestPPU / 10000; //only gold, no silver (00), no copper (00).

        	let newItem = {
        		id: id,
        		name: item.name,
        		ppu: lowestPPU,
        		reagentsTotal: 0,
	    		profit: lowestPPU
        	}

        	console.log(newItem);

        	global.settings.items.push(newItem);
        	renderItems(global.settings.items);
        }
    });
}

function getRealms() {
	$.ajax({
        url: getRequestUrl(global.api.realms),
        data: {
        	namespace: global.settings.namespace,
        	locale: global.settings.locale
        },
        success: function(data) {
        	global.data.realms = data;
        }
    });
}

function renderItems(items = global.settings.items) {
	$('section.items').empty();
	const template = global.templates.item;

	for (let i = 0, item; item = items[i]; i++) {
		let html = template(item);
		$('section.items').append(html);
	}

	const dummytemplate = global.templates.itemdummy;
	$('section.items').append(dummytemplate());

	initItemEventListeners();
}

function getRequestUrl(baseurl, keys) {
	const url = 'https://eu.api.battle.net';

	if (keys) {
		for (let key in keys) {
			baseurl = baseurl.replace('{{' + key + '}}', keys[key]);
		}
	}

	return url + baseurl;
}

function invokeFunction(fn, args) {
    fn = (typeof fn == "function") ? fn : window[fn];  // Allow fn to be a function object or the name of a global function
    return fn.apply(this, args || []);  // args is optional, use an empty array by default
}

Handlebars.getTemplate = function(name) {
    if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined) {
        $.ajax({
            url : 'templates/' + name + '.html',
            success : function(data) {
                if (Handlebars.templates === undefined) {
                    Handlebars.templates = {};
                }
                Handlebars.templates[name] = Handlebars.compile(data);
            },
            async: false
        });
    }

    return Handlebars.templates[name];
};