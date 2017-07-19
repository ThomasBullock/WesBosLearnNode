import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocompltete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autocompltete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );


makeMap( $('#map') );

const heartForms = $$('form.heart');  // querySelectorAll
heartForms.on('submit', ajaxHeart);