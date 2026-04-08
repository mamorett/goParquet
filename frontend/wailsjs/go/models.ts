export namespace main {
	
	export class Config {
	    last_database_path: string;
	    window_width: number;
	    window_height: number;
	    sidebar_width: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.last_database_path = source["last_database_path"];
	        this.window_width = source["window_width"];
	        this.window_height = source["window_height"];
	        this.sidebar_width = source["sidebar_width"];
	    }
	}
	export class DBStats {
	    total_entries: number;
	    images_found: number;
	    images_missing: number;
	    unique_prompts: number;
	    oldest_date: string;
	    newest_date: string;
	    file_size_str: string;
	
	    static createFrom(source: any = {}) {
	        return new DBStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_entries = source["total_entries"];
	        this.images_found = source["images_found"];
	        this.images_missing = source["images_missing"];
	        this.unique_prompts = source["unique_prompts"];
	        this.oldest_date = source["oldest_date"];
	        this.newest_date = source["newest_date"];
	        this.file_size_str = source["file_size_str"];
	    }
	}
	export class Entry {
	    image_path: string;
	    prompt: string;
	    description: string;
	    created_at: string;
	    modified_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Entry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.image_path = source["image_path"];
	        this.prompt = source["prompt"];
	        this.description = source["description"];
	        this.created_at = source["created_at"];
	        this.modified_at = source["modified_at"];
	    }
	}
	export class FilterParams {
	    existence_filter: string;
	    selected_subdirs: string[];
	    subdir_query: string;
	    selected_prompts: string[];
	    sort_option: string;
	    search_query: string;
	    search_in: string;
	    page: number;
	    items_per_page: number;
	
	    static createFrom(source: any = {}) {
	        return new FilterParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.existence_filter = source["existence_filter"];
	        this.selected_subdirs = source["selected_subdirs"];
	        this.subdir_query = source["subdir_query"];
	        this.selected_prompts = source["selected_prompts"];
	        this.sort_option = source["sort_option"];
	        this.search_query = source["search_query"];
	        this.search_in = source["search_in"];
	        this.page = source["page"];
	        this.items_per_page = source["items_per_page"];
	    }
	}
	export class ImageMeta {
	    width: number;
	    height: number;
	    file_size_kb: number;
	    aspect_ratio: string;
	    megapixels: number;
	    exists: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ImageMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.file_size_kb = source["file_size_kb"];
	        this.aspect_ratio = source["aspect_ratio"];
	        this.megapixels = source["megapixels"];
	        this.exists = source["exists"];
	    }
	}
	export class PageResult {
	    entries: Entry[];
	    total_items: number;
	    total_pages: number;
	    current_page: number;
	    all_subdirs: string[];
	    all_prompts: string[];
	    search_error: string;
	
	    static createFrom(source: any = {}) {
	        return new PageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.entries = this.convertValues(source["entries"], Entry);
	        this.total_items = source["total_items"];
	        this.total_pages = source["total_pages"];
	        this.current_page = source["current_page"];
	        this.all_subdirs = source["all_subdirs"];
	        this.all_prompts = source["all_prompts"];
	        this.search_error = source["search_error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

