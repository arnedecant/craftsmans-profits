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

let config = {
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
		items: localStorage.getItem('items'),
		realm: localStorage.getItem('realm'),
		locale: localStorage.getItem('locale'),
		namespace: localStorage.getItem('namespace'),
		auctions: JSON.parse(localStorage.getItem('auctions')) || []
	},
	data: {
		auctions: null,
		realms: localStorage.getItem('realms'),
	}
}

jQuery(document).ready(function($){
	config.settings.locale = 'en_GB';
	config.settings.namespace = 'dynamic-eu';
	config.settings.realm = 'Stormrage';
	config.settings.items = items;

	init();
});

function init() {
	config.templates.item = Handlebars.getTemplate('item');
	config.templates.itemdummy = Handlebars.getTemplate('itemdummy');

	renderItems(config.settings.items);
	// getAuctions(config.settings.realm);
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

function getAuctions(realm = config.settings.realm, onSuccess = null) {
	$.ajax({
        url: getRequestUrl(config.api.auctions, {realm: realm}),
        data: {
        	locale: config.locale,
        	apikey: config.key,
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
        		config.data.auctions = data.contents.auctions;
        		if (onSuccess) invokeFunction(onSuccess.function, onSuccess.params);
        	});
        }
    });
}

function getItem(id) {
	if (!id) return;

	if (!config.data.auctions) {
		getAuctions(config.settings.realm, {
			function: 'getItem',
			params: [id]
		});

		return;
	}

	$.ajax({
        url: getRequestUrl(config.api.item, {id: id}),
        data: {
        	locale: config.settings.locale,
        	apikey: config.key
        },
        success: function(data) {
        	const item = data;
        	let itemAuctions = [];

    		for (let i = 0, auction; auction = config.data.auctions[i]; i++) {
        		if (auction.item == item.id) {
        			itemAuctions.push(auction);
        		}
        	}

        	config.settings.auctions = config.settings.auctions.concat(itemAuctions);
        	localStorage.setItem('auctions', JSON.stringify(config.settings.auctions));

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

        	config.settings.items.push(newItem);
        	renderItems(config.settings.items);
        }
    });
}

function getRealms() {
	$.ajax({
        url: getRequestUrl(config.api.realms),
        data: {
        	namespace: config.settings.namespace,
        	locale: config.settings.locale
        },
        success: function(data) {
        	config.data.realms = data;
        }
    });
}

function renderItems(items = config.settings.items) {
	$('section.items').empty();
	const template = config.templates.item;

	for (let i = 0, item; item = items[i]; i++) {
		let html = template(item);
		$('section.items').append(html);
	}

	const dummytemplate = config.templates.itemdummy;
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