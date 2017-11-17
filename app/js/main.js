const items = [
	{
		id: '1',
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
		id: '2',
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

jQuery(document).ready(function($){
	init();
});

function init() {
	const template = Handlebars.getTemplate('item');

	for (let i = 0, item; item = items[i]; i++) {
		let html = template(item);
		$("section.items").append(html);
	}

	
}

class Item {
	constructor(options) {
		this.name = options.name;
		this.price = options.price;
		this.materials = options.materials;
		this.itemRawHTML = window.location.href + '/inc/item.html';
		this.reagentRawHTML = window.location.href + '/inc/reagent.html';
	}

	render() {

	}
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