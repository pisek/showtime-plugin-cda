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
	var PREFIX = plugin.getDescriptor().id;
	var LOGO = plugin.path + "logo.png";
	var BACKGROUND = plugin.path + "views/img/background.jpg";
	
	var DEFAULT_URL = 'http://www.cda.pl/video/';
	
	var service = plugin.createService(plugin.getDescriptor().title, PREFIX + ":start", "video", true, LOGO);
	
	var settings = plugin.createSettings(plugin.getDescriptor().title, LOGO, plugin.getDescriptor().synopsis);
	
	settings.createMultiOpt('quality', "Video quality (if not found - closest will be selected)", [
		['letMeChoose', 'Let me choose', true],
		['1080', '1080p'],
		['720', '720p'],
		['480', '480p'],
		['360', '360p'],
		['240', '240p']
		], function(v) {
			service.quality = v;
		}
	);
	
	function setPageHeader(page, title, image) {
		if (page.metadata) {
			page.metadata.title = title;
			page.metadata.logo = LOGO;
			if (image) {
				page.metadata.background = image;
				page.metadata.backgroundAlpha = 0.3;
			} else {
				page.metadata.background = BACKGROUND;
				page.metadata.backgroundAlpha = 0.7;
			}
		}
	}

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
	
	function resolveDuration(h, m, s) {
		if (h != null) {
			while(h.length != 2) {
				h = '0' + h;
			}
		} else {
			h = '00';
		}
		if (m != null) {
			while(m.length != 2) {
				m = '0' + m;
			}
		} else {
			m = '00';
		}
		if (s != null) {
			while(s.length != 2) {
				s = '0' + s;
			}
		} else {
			s = '00';
		}
			
		return h + ':' + m + ':' + s;
	}
	
	function browseItems(page, search, poczekalnia) {
		var moreSearchPages = true;		
		var pageNumber = 1;
		page.entries = 0;

		//desc - 1, id - 2, img - 3, name - 4
		var patternVideo = /<label title="([\s\S]*?)">\s*<div class="videoElem">\s*<a class="aBoxVideoElement" .* href="\/video\/(\d\w+)".*>\s*<img.*src="(.*?)".*>[\s\S]*?<a.*alt="(.*?)">/igm;
		var matcherVideo = [1, 2, 3, 4];
		
		//desc - 1, id - 2, img - 3, name - 4
		var patternSearch = /<label title="([\s\S]*?)">[\s\S]*?<a.*href="\/video\/(\d\w+)".*>[\s\S]*?<img.*src="(.*?)".*\s*alt="(.*?)">/igm;
		var matcherSearch = [1, 2, 3, 4];
		
		//desc - 1, id - 4, img - 2, name - 3
		var patternPoczekalnia = /<div class="videoMiniaturkaWrap"><img title="([\s\S]*?)" src="([\s\S]*?)" [\s\S]*? alt="([\s\S]*?)" class="videoMiniaturka"[\s\S]*? href="\/video\/(\d\w+)">/igm;
		var matcherPoczekalnia = [1, 4, 2, 3];
		
		var pattern;
		var matcher;
		if (search == null) {
				if (poczekalnia) {
					pattern = patternPoczekalnia;
					matcher = matcherPoczekalnia;
				} else {
					pattern = patternVideo;
					matcher = matcherVideo;
				}
		} else {
			pattern = patternSearch;
				matcher = matcherSearch;
		}
		
		var pagePattern = /<span class="disabledPage">(\d+)<\/span> <span class="disabled">&gt;<\/span>/igm;
		
		function loader() {
			
			//for the purpose of search - loader in search and in showing search values are different instances (!?)
			//therefore we have to check this flag as well
			if (search != null && !moreSearchPages) {
				return false;
			}
			
			page.loading = true;
		
			var url;
			if (search == null) {
					if (poczekalnia) {
						url = DEFAULT_URL + 'poczekalnia/p' + pageNumber;
					} else {
						url = DEFAULT_URL + 'p' + pageNumber;
					}
			} else {
				url = DEFAULT_URL + 'show/' + search.replace(/\s/g, '_') + '/p' + pageNumber;
			}
			
			d(url);
			var c = showtime.httpReq(url);
			
			while ((match = pattern.exec(c)) !== null) {
			
				//d(match);

				page.appendItem(PREFIX + ":movie:" + match[matcher[1]], 'video', {
							title : new showtime.RichText(match[matcher[3]]),
							icon : new showtime.RichText(match[matcher[2]]),
							description : new showtime.RichText(match[matcher[0]])
						});
				page.entries++; // for searcher to work
				
					if (poczekalnia && page.entries == 14) {
						page.appendItem("", "separator", {
								title: 'Newest in waiting room'
						});
					}
	
			}
			
			page.loading = false;
			if (pageNumber == 1 && page.metadata) {	//only for first page - search results
					page.metadata.title += ' (' + page.entries;
					if (page.entries == 24) {
						page.metadata.title += '+';
					}
					page.metadata.title += ')';
				}
			
			pageNumber++;
			match = pagePattern.exec(c);
			d(match == null);
			moreSearchPages = (match == null);
			return match == null;
		}
		
		//for search to work
		loader();
		page.paginator = loader;
		
	}
	
	plugin.addSearcher(plugin.getDescriptor().title, LOGO, function(page, search) {
		setPageHeader(page, plugin.getDescriptor().title);
		browseItems(page, search);
	});

	plugin.addURI(PREFIX + ":start", function(page) {
		setPageHeader(page, plugin.getDescriptor().synopsis);
		page.type = "directory";
		page.contents = "movies";
		
		page.appendItem(PREFIX + ":poczekalnia", 'directory', {
			title : "Waiting room",
		});
		
		page.appendItem("", "separator", {
				title: 'Newest'
		});
		
		browseItems(page);
	});
	
	plugin.addURI(PREFIX + ":poczekalnia", function(page) {
		setPageHeader(page, plugin.getDescriptor().synopsis);
		page.type = "directory";
		page.contents = "movies";
		
		page.appendItem("", "separator", {
				title: 'Lately popular in waiting room'
		});
		
		browseItems(page, null, true);
	});
	
	plugin.addURI(PREFIX + ":movie:(.*)", function(page, id) {
		setPageHeader(page, "Searching...");
		page.loading = true;
		page.type = "directory";
		page.contents = "movies";
		
		d(DEFAULT_URL + id);
		var c = showtime.httpReq(DEFAULT_URL + id);
		
		//show screen only if letMeChoose quality
		if (service.quality == 'letMeChoose') {
		
			// 1 - type, 2 - description, 3 - title, 4 - imageurl, 5 - negative-rating
			var pattern = /<meta property="og:type" content="(.*?)".*?>[\s\S]*?<meta property="og:description" content="([\s\S]+?)".*?>\s*?<meta property="og:title" content="(.+?)".*?>\s*?<meta property="og:image" content="(.+?)".*?>[\s\S]*?<span class="bialeSred"><span class="szareSred" style="width:(\d*?)px"><\/span><\/span>/igm;
			if ((match = pattern.exec(c)) !== null) {
				d(match[1]);
				d(match[2]);
				d(match[3]);
				d(match[4]);
				d(match[5]);
				var type = match[1];
				var desc = match[2];
				var title = match[3];
				var image = match[4];
				var rating = (80-match[5])/80*100;
				d(rating);
				
				setPageHeader(page, title, image);
			}
			
			
			// 1 - duration
			var pattern = /<meta itemprop='duration' content='T((\d*?)H)*((\d*)?M)*(\d+?)S' \/>/igm;
			if ((match = pattern.exec(c)) !== null) {
				d(match);
				var h = match[2];
				var m = match[4];
				var s = match[5];
				
				var duration = resolveDuration(h, m, s);
				d(duration);
			}
			
			page.appendItem("", "separator", {
						title: "Quality"
			});
		
		}
		
		// 1 - url, 2 - id, 3 - quality
		var pattern = /<a.*?href="\/video\/((\d\w+)\?wersja=(\d\w+)p)".*?>/igm;
		var addedQuality = false;
		var bestMatch;
		while ((match = pattern.exec(c)) !== null) {
			match[3] = parseInt(match[3]);
			d(match);
			var id = match[2];
			var quality = match[3];
			var url = match[1];
			addedQuality = true;
			
			if (service.quality == 'letMeChoose') {
			
				page.appendItem(PREFIX + ":video:" + id + ":" + quality + ":" + url, 'video', {
						title : quality+"p",
						icon : image,
						genre: type,
						rating: rating,
						duration: duration,
						description : desc
					});
					
				} else {
					
					var desiredQuality = parseInt(service.quality);
					
					if (desiredQuality == quality) {	//find desired quality
						page.redirect(PREFIX+":video:" + id + ":" + quality + ":" + url);
					}
					
					// init
					if (bestMatch == null) {
						bestMatch = match;
						continue;
					}
					
				//find closest quality from bottom (bottom first)
				if (quality > bestMatch[3] && quality < desiredQuality) {
					bestMatch = match;
					d(bestMatch);
					continue;
				}
				
				//find closest quality from top
				if (quality < bestMatch[3] && quality > desiredQuality) {
					bestMatch = match;
					d(bestMatch);
					continue;
				}
				
				}
			
		}
		
		d(bestMatch);
		
		if (service.quality != 'letMeChoose') {
				//if there are no quality versions, show a default one
			if (!addedQuality) {
				page.redirect(PREFIX + ":video:" + id + ":480:" + id);
			} else {
				if (bestMatch == null) {
						page.error("Selected video is not available on this platform.");
					return;
				} else {
					page.redirect(PREFIX+":video:" + bestMatch[2] + ":" + bestMatch[3] + ":" + bestMatch[1]);
				}
			}
		} else {
				//if there are no quality versions, run a default one
			if (!addedQuality) {
				page.appendItem(PREFIX + ":video:" + id + ":480:" + id, 'video', {
						title : "Default quality",
						icon : image,
						genre: type,
						rating: rating,
						duration: duration,
						description : desc
					});
			}
		}
		
		page.loading = false;
		
	});
	
	plugin.addURI(PREFIX + ":video:(.*):(.*):(.*)", function(page, id, quality, url) {
		setPageHeader(page, "Searching...");
		page.loading = true;
		var videoUrl;
		var title;
		var metadata = {};
		
		//var c = showtime.httpReq('http://pisek.cf/cda_test.html');
		var c = showtime.httpReq(DEFAULT_URL + url);
		//d(c.headers);
		
		// normal pattern when there is no overload on cda
		// 1 - movie url
		var pattern_normal = /if\(checkFlash\(\)[\s\S]*\)\s*?\{\s*l='(.*)';\s*jwplayer/igm;
		
		if ((match = pattern_normal.exec(c)) !== null) {
			/*c = showtime.httpReq(match[1]);
			d(c.headers);*/
			d('Video found: ' + match[1]);
			videoUrl = match[1];
		} else {
			
			d('Cannot find anything with normal pattern - trying overload');
			
			// overload pattern - obfuscated link
			// 1 - "function(..) {..} (..)" (needs eval and variable to set the result to)
			//var pattern_overload = /\}\neval\(([\s\S]*?)\)\n*var AD_TYPE/igm;
			var pattern_overload = /\}\s*eval\(([\s\S]*?)\)\s*function onLinearAdStart/igm;
			if ((match = pattern_overload.exec(c)) !== null) {
				
				d('Overload pattern found - extracting obfuscated link');
				
				//d(match[1]);
				eval('var newC = ' + match[1]);
				//d(newC);
				
				var pattern_overload_normal = /url:'(.*?)',/igm;
				if ((match = pattern_overload_normal.exec(newC)) !== null) {
					/*newC = showtime.httpReq(match[1]);
					d(newC.headers);*/
					d('Video found: ' + match[1]);
					videoUrl = match[1];
				}
				
			}
			
		}
		
		if (!videoUrl) {
			//youtube movie (or other)
			page.error("Cannot open links from other sites (like youtube etc).");
			d('cannot open movie other than cda');
			return;
		}
		
		// 1 - title
		var pattern = /<meta property="og:title" content="(.+?)".*?>/igm;
		if ((match = pattern.exec(c)) !== null) {
			title = match[1];
		}
		
		metadata.title = title;
		metadata.sources = [{ url: videoUrl, bitrate: quality }];
		metadata.canonicalUrl = PREFIX + ":movie:" + id;
		metadata.no_fs_scan = true;
		d(metadata);
		setPageHeader(page, title);
		page.loading = false;
		page.source = "videoparams:"+showtime.JSONEncode(metadata);
		page.type = "video";
	});
	
})(this);
