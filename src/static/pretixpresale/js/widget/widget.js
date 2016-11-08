/*
 pretix embeddable widget
 */

(function () {
    window.PretixStrings = {  // TODO: Translate
        'en': {
            'sold_out': 'Sold out',
            'reserved': 'Reserved',
            'tax': 'incl. %s% tax',
            'voucher_required': 'Only available with a voucher'
        }
    };
    
    window.BuildPretixWidget = function (main_div) {
        var widget = {
            'version': 1,
            'endpoint': 'http://localhost:8000/mrmcd/2016/',

            'strings': window.PretixStrings['en'],
            'main_div': null,
            'event': null,

            '_getXHR': function () {
                try {
                    return new window.XMLHttpRequest();
                } catch (e) {
                    // explicitly bubble up the exception if not found
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                }
            },

            '_getJSON': function (endpoint, callback) {
                var xhr = widget._getXHR();
                xhr.open("GET", widget.endpoint + endpoint, true);
                xhr.onload = function (e) {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            callback(JSON.parse(xhr.responseText));
                        } else {
                            console.error(xhr.statusText);
                        }
                    }
                };
                xhr.onerror = function (e) {
                    console.error(xhr.statusText);
                };
                xhr.send(null);
            },

            '_isSecure': function () {
                return /https.*/.test(document.location.protocol)
            },

            'show_product_list': function (data) {
                widget.main_div.innerHTML = null;

                var wrapper_div = document.createElement("div");
                wrapper_div.setAttribute("class", "pretix-widget-wrapper");
                widget.main_div.appendChild(wrapper_div);

                var grplength = data.items_by_category.length;

                for (var grpi = 0; grpi < grplength; grpi++) {
                    var grp = data.items_by_category[grpi];
                    var category_div = document.createElement("div");
                    category_div.setAttribute("class", "pretix-widget-category");
                    if (grp.id) {
                        category_div.setAttribute("data-id", grp.id);
                    }
                    wrapper_div.appendChild(category_div);

                    if (grp.name) {
                        var category_head_div = document.createElement("div");
                        category_head_div.setAttribute("class", "pretix-widget-head");
                        category_div.appendChild(category_head_div);

                        var category_h3 = document.createElement("h3");
                        category_h3.textContent = grp.name;
                        category_head_div.appendChild(category_h3);

                        if (grp.description) {
                            // TODO: Markdown
                            var category_p = document.createElement("p");
                            category_p.textContent = grp.description;
                            category_head_div.appendChild(category_p);
                        }
                    }

                    var itemcnt = grp.items.length;
                    for (var itemi = 0; itemi < itemcnt; itemi++) {
                        var item = grp.items[itemi];
                        var item_row_div = document.createElement("div");
                        item_row_div.setAttribute("class", "pretix-product-row");
                        category_div.appendChild(item_row_div);

                        var item_name_div = document.createElement("div");
                        item_name_div.setAttribute("class", "pretix-product");
                        item_row_div.appendChild(item_name_div);

                        var item_name_span = document.createElement("span");
                        item_name_span.setAttribute("class", "pretix-product-name");
                        item_name_div.appendChild(item_name_span);
                        item_name_span.textContent = item.name;

                        if (item.description) {
                            var item_name_p = document.createElement("p");
                            item_name_p.setAttribute("class", "pretix-product-description");
                            item_name_div.appendChild(item_name_p);
                            item_name_p.textContent = item.description;  // TODO: Markdown
                        }

                        // TODO: pictures, prices, tax, form, availability, variations
                        if (item.has_variations) {
                            
                        } else {
                            var item_price_div = document.createElement("div");
                            item_price_div.setAttribute("class", "pretix-product-price");
                            item_row_div.appendChild(item_price_div);

                            var item_price_span = document.createElement("span");
                            item_price_span.setAttribute("class", "pretix-product-price-value");
                            item_price_div.appendChild(item_price_span);
                            item_price_span.textContent = parseFloat(item.price).toFixed(2) + " " + data.currency;

                            var tax = parseFloat(item.tax_rate);
                            if (tax) {
                                var item_tax_span = document.createElement("span");
                                item_tax_span.setAttribute("class", "pretix-product-price-tax");
                                item_price_div.appendChild(item_tax_span);
                                item_tax_span.textContent = widget.strings["tax"].replace("%s", tax.toFixed(2));
                            }

                            var item_field_div = document.createElement("div");
                            item_field_div.setAttribute("class", "pretix-product-form");
                            item_row_div.appendChild(item_field_div);

                            if (item.require_voucher) {
                                var item_field_span = document.createElement("span");
                                item_field_span.setAttribute("class", "pretix-availability-voucher");
                                item_field_span.textContent = widget.strings["voucher_required"];
                                item_field_div.appendChild(item_field_span);
                            } else if (item.avail[0] == 100) {
                                var item_field_input = document.createElement("input");
                                item_field_input.setAttribute("class", "pretix-amount-input");
                                item_field_input.setAttribute("type", "number");
                                item_field_input.setAttribute("placeholder", "0");
                                item_field_input.setAttribute("min", "0");
                                item_field_input.setAttribute("max", item.order_max);
                                item_field_input.setAttribute("name", "item_" + item.id);
                                item_field_div.appendChild(item_field_input);
                            } else {
                                var item_field_span = document.createElement("span");
                                if (item.avail[0] == 0) {
                                    item_field_span.setAttribute("pretix-availability-gone");
                                    item_field_span.textContent = widget.strings["sold_out"];
                                } else {
                                    item_field_span.setAttribute("pretix-availability-unavailable");
                                    item_field_span.textContent = widget.strings["reserved"];
                                }
                                item_field_div.appendChild(item_field_span);
                            }
                            

                        }
                    }

                    // TODO: variations
                    // TODO: voucher
                    // TODO: free price
                }
            },

            'load_product_list': function () {
                widget._getJSON('widget/product_list', widget.show_product_list)
            },

            'init': function (main_div) {
                widget.main_div = main_div;
                widget.event = widget.main_div.getAttribute("event");

                widget.load_product_list();
            }
        };
        widget.init(main_div);
        return widget;
    };

    document.createElement("pretix-widget");
    
    var widgets = document.querySelectorAll("pretix-widget");
    var wlength = widgets.length;

    for (var i = 0; i < wlength; i++) {
        var widget = widgets[i];
        window.BuildPretixWidget(widget);
    }

    // TODO: on dom ready, see https://stackoverflow.com/questions/9899372/pure-javascript-equivalent-to-jquerys-ready-how-to-call-a-function-when-the
    // TODO: attributes like category, language, ...
    window.setTimeout(widget.init, 500);
})();