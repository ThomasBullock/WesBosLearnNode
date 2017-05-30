import '../sass/style.scss';

import { $, $$ } from './modules/bling';

import autocompltete from './modules/autocomplete';

autocompltete( $('#address'), $('#lat'), $('#lng') );