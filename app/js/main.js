const ELEMENTS = {
	anchor: {
		name: 'anchor',
		tag: 'a',
		scrape: 'href',
		containerClass: 'collection',
		fullWidth: false
	},
	image: {
		name: 'image',
		tag: 'img',
		scrape: 'src',
		containerClass: '',
		fullWidth: true
	}
}

let partials = {
	card: ''
};

jQuery(document).ready(function($){
	initPartials();
	materialize();
	init();
});

function initPartials() {
	for (let key in partials) {
		getPartial({
			url: window.location.href + '/inc/'+key+'.html', 
			onSuccess: function(data) {
				partials[key] = data;
			}
		});
	}
}

function materialize() {
	$('select').material_select();
	$('select').on('contentChanged', function() {
		$(this).material_select(); // re-initialize (update)
	}); 
}

function init() {
	

	for (let key in ELEMENTS) {
		if (!ELEMENTS.hasOwnProperty(key)) continue;
		let el = ELEMENTS[key];

		let option = '<option value="'+el.name+'" data-name="'+el.name+'" data-tag="'+el.tag+'" data-scrape="'+el.scrape+'">'+el.name+'</option>'
		$('form.scraper select.element').append(option).trigger('contentChanged');
	}

	$('form.scraper').on('submit', function(e) {
		e.preventDefault();
		e.stopPropagation();

		let $form = $(this);
		let address = $form.find('input.address').val();
		let element = ELEMENTS[$form.find('select.element').val()];

		if (!element) alert('An error has occurred.');

		$.getJSON('https://whateverorigin.herokuapp.com/get?url=' + encodeURIComponent(address) + '&callback=?', function(data){
			let results = getResults(data.contents, element, address, false);
			let html = '';

			if (element.tag === 'a') {
				html += '<div class="row"><div class="col s12"><section class="card-panel ' + element.containerClass + '">';
			} else if (element.tag === 'img') {
				html += '<div class="row"><div class="col s12"><section class="cards-container ' + element.containerClass + '">';
			}

			if (results) {
				for (let i = 0, r; r = results[i]; i++) {
					// html += '<li class="collection-item">';

					if (element.tag === 'a') {
						html += '<a href="' + r + '" target="_blank" class="collection-item">' + r + '</a>';

						if (isInternalUrl(address, r)) {
							// console.log(r);
						}
					} else if (element.tag === 'img') {
						let partial = getPartial({
							html: partials.card, 
							variables: {
								title: '',
								image: r,
								content: 'Lorem ipsum dolor sit amet.',
								linkUrl: r,
								linkLabel: 'View image'
							}
						});

						html += partial;
					}

					// html += '</li>';
				}
			}

			// if (element.tag === 'img') html += '</div></div>';
			html += '</section></div></div>';

			if (element.fullWidth) {
				$('.results-container').removeClass('container');
			} else {
				$('.results-container').addClass('container');
			}

			$('.results-container').html(html);
		});
	});
}

function getResults(content, element, address, getAttributes) {
	let results = [];
	let data = content.split('<' + element.tag + ' ');
	let scrape = element.scrape + '=';

	for (let i = 1, part; part = data[i]; i++) {
		let url = part.getBetween(scrape + "'", "'");

		if (!url) {
			url = part.getBetween(scrape + '"', '"');
		}

		if (!urlAllowed(url)) continue;

		if (!url.startsWith("http")) {
			if (address.endsWith('/') && url.startsWith('/')) {
				url = address + url.substr(1);
			}
		}

		results.push(url);
	}

	return results;
}

function urlAllowed(url) {
	if (!url) return false;

	const BLACKLIST = ['javascript', '#', 'mailto'];

	for (let i = 0, bl; bl = BLACKLIST[i]; i++) {
		if (url.startsWith(bl)) return false;
	}

	return true;
}

function isInternalUrl(mainUrl, scrapeUrl) {
	mainUrl = stripUrl(mainUrl);
	scrapeUrl = stripUrl(scrapeUrl);

	mainUrl = mainUrl.split('/')[0];
	scrapeUrl = scrapeUrl.split('/')[0];

	if (mainUrl == scrapeUrl) {
		return true;
	} else {
		return false;
	}
}

function stripUrl(url) {
	let arrUndo = ['https', 'http', '://', '/'];

	let result = url;

	for (let i = 0, undo; undo = arrUndo[i]; i++) {
		result = result.replace(undo, '');
	}

	arrResult = result.split('.');

	if (arrResult.length >= 3) arrResult.shift(); // removes first element;

	result = arrResult.join('.');

	return result;
}

function getPartial(options) {
	if (options.html && !options.url) {
		return fillPartial(options);
	} else {
		$.ajax({
			url: options.url,
			success: function(data) {
				fillPartial(options, data);
			},
			error: function(error) {
				if (typeof options.onError === 'function') options.onError(error);
			}
		});
	}
}

function fillPartial(options, data) {
	if (data) options.html = data;

	let html = options.html;

	if (options.variables) {
		for (let key in options.variables) {
			html = html.replace('{{' + key + '}}', options.variables[key]);
		}
	}

	if (options.onSuccess && typeof options.onSuccess === 'function') options.onSuccess(html);

	return html;
}

String.prototype.getBetween = function(start, end) {
	if (!this) return;
	let result = this.split(start)[1];
	if (!result) return;
	return result.split(end)[0];
}