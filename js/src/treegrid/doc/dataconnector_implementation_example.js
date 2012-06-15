/**
 * Contacts DataConnector
 * This is an example on how to implement a DataConnector
 */
var Contacts = function () {
    // set the url for the RESTful web service
    this.url = 'https://my.server.com/rest/contacts';

    // store the cached contacts in an array
    this.items = [];

    // optionally define the order and visibility of columns
    this.setOptions({
        'columns': [
            {'name': 'firstname'},
            {'name': 'lastname'},
            {'name': 'age'}
        ]
    });
};

// set the links.DataConnector as prototype
Contacts.prototype = new links.DataConnector();

Contacts.prototype.getCount = function () {
    // set the count in such a way that we can always scroll down to get more
    // items, but cannot jump in a large set of data (which is an expensive
    // operation for key/value databases)
    return this.items.length + 10;
};

Contacts.prototype.getChanges = function (index, num, items, callback, errback) {
    // mark items as changed when the item is replaced by an other object
    // note that the change of a field inside an item will not be observed this way,
    // only the replacement of an item
    var changedItems = [];
    for (var i = 0; i < num; i++) {
        var item = items[i];
        if (item != this.items[index + i]) {
            changedItems.push(item);
        }
    }

    callback({
        'totalItems': this.getCount(),
        'items': changedItems
    });
};

Contacts.prototype.getItems = function (index, num, callback, errback) {
    var items = this.items;

    // method to built a response containing the requested subset of the data
    var me = this;
    var createResponse = function () {
        var requestedItems = [];
        for (var i = 0; i < num; i++) {
            requestedItems[i] = items[index + i];
        }
        return {
            'totalItems': me.getCount(),
            'items': requestedItems
        };
    };

    // check if there are uncached items
    var hasUncachedItems = false;
    for (var i = index, iMax = index+num; i < iMax; i++) {
        if (!items[i])  {
            hasUncachedItems = true;
            break;
        }
    }

    // if all items are cached, we can directly return them
    if (!hasUncachedItems) {
        callback(createResponse());
        return;
    }

    // retrieve items from the server
    var url = this.url + '&index=' + index + '&limit=' + num;
    $.ajax({
        'url': url,
        'success': function (retrievedItems) {
            // read the entries
            for (var i = 0, i < retrievedItems.length; i++) {
                items[index + i] = retrievedItems[i];
            }
            callback(createResponse());
        },
        'error': function (err) {
            errback('Could not retrieve results');
        }
    });
};
