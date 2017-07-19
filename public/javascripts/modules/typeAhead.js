import axios from 'axios';
import dompurify from 'dompurify';
 
function searchResultsHTML(stores) {
	return stores.map(store => {
		return `
			<a href="/store/${store.slug}" class="search__result">
				<strong>${store.name}</strong>
			</a>
		`;
	}).join('')
}
				// <p>${store.description}</p>

function typeAhead(search) {
	if(!search) return; // if search is not on the page we dont want to run this function

	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');

	console.log(searchInput, searchResults);

	searchInput.on('input', function() { // bling bullshit for addEventListener
		// if there is no value quit it!
		if(!this.value) {
			searchResults.style.display = 'none';
			return; // stop!
		}
		// console.log(this.value);

		// show the search results!
		searchResults.style.display = 'block';
		// searchResults.innerHTML = '';

		axios
			.get(`/api/search?q=${this.value}`)
			.then(res => {
				console.log(res.data.length);
				if(res.data.length) {
					console.log('There is something to show');
					const html = dompurify.sanitize(searchResultsHTML(res.data));
					// console.log(html);
					searchResults.innerHTML = html;
					return;
				} 
				// tell them nothing came back
				searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">Sorry no results found for ${this.value}</div>`);
			})
			.catch(err => {
				console.error(err);
			}); 
	});

	// handle keyboard inputs
	searchInput.on('keyup', (e) => {
		// if they aren't pressing up down or enter quit!
		if(![38, 40, 13].includes(e.keyCode)) {
			return; // nah
		}
 		const activeClass = 'search__result--active';
 		const current = search.querySelector(`.${activeClass}`);  // same as 'search__results--active'
 		const items = search.querySelectorAll('.search__result');
 		let next;   
 

 		if(e.keyCode === 40 && current) {
 			next = current.nextElementSibling || items[0]; // fall back to 1st item in array
 		} else if (e.keyCode === 40) {
 			next = items[0];
 		} else if (e.keyCode === 38 && current) {
 			next = current.previousElementSibling || items[items.length - 1];
 		}	else if (e.keyCode === 38) {
 			next = items[items.length - 1];
 		} else if (e.keyCode === 13 && current.href) {  // someone hits enter and there is a current element with href on it
 			window.location = current.href;
 			return;
 		}

 		next.classList.add(activeClass);
 		if (current) {
 			current.classList.remove(activeClass); 	 			
 		}

 		console.log(next);

	})  
}

export default typeAhead;