/**
 *  cda plugin for Movian
 *
 *  Copyright (C) 2015 Pisek
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  
 */


(function(plugin) {
    var PREFIX = 'kisscartoon';
    var logo = plugin.path + "logo.png";
    
    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
	
    function browseItems(page, search) {
        var pageNumber = 0;
        page.entries = 0;

        var url = 'http://kisscartoon.me/CartoonList/LatestUpdate';
        d(url);
        var c = showtime.httpReq(url);
        d(c);
        
    }

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        
        page.appendItem("", "separator", {
            title: 'Newest'
        });
        browseItems(page);
    });

})(this);
