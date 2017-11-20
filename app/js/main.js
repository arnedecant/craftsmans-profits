const items = [
	{
		id: '124461',
	    name: 'Demonsteel Bar',
	    marketPrice: '75.00',
	    reagents: [
	        {
	            name: 'Leystone Ore',
	            ppu: '8.06',
	            amount: '1',
	            total: '8.06'
	        },
	        {
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
	    marketPrice: '7663.00',
	    reagents: [
	        {
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
		namespace: localStorage.getItem('namespace')
	},
	data: {
		auctions: localStorage.getItem('auctions'),
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

	initEventListeners();

	renderItems(config.settings.items);
	// getAuctions(config.settings.realm);
}

function initEventListeners() {
	// const clickEvents = [
	// 	{element: 'article.item.dummy > button', callback: 'addNewItem'},
	// 	{element: 'body', callback: 'addNewItem'}
	// ];

	// for (let i = 0, ce; ce = clickEvents[i]; i++) {
	// 	let element = document.querySelector(ce.element);

	// 	if (element) {
	// 		element.removeEventListener('click', ce.callback);
	// 		element.addEventListener('click', ce.callback);
	// 	}
	// }

	$('article.item.dummy > button').off('click');
	$('article.item.dummy > button').on('click', 'addNewItem');
}

function addNewItem(e) {
	// let id = prompt("Please enter the item ID", "New item");
	console.log('addNewItem');
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

function getAuctions(realm, item) {
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
        		console.log(config.data.auctions);
        	});
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

function renderItems(items) {
	$('section.items').empty();
	const template = config.templates.item;

	for (let i = 0, item; item = items[i]; i++) {
		let html = template(item);
		$('section.items').append(html);
	}

	const dummytemplate = config.templates.itemdummy;
	$('section.items').append(dummytemplate());
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
    
    initEventListeners();
    return Handlebars.templates[name];
};