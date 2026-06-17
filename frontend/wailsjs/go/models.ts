export namespace smtp {

	export class LogEntry {
	    timestamp: string;
	    level: string;
	    direction: string;
	    message: string;

	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.level = source["level"];
	        this.direction = source["direction"];
	        this.message = source["message"];
	    }
	}
	export class SMTPConfig {
	    host: string;
	    username: string;
	    password: string;
	    email: string;
	    testTo: string;
	    sendMail: boolean;
	    skipTLSVerify: boolean;

	    static createFrom(source: any = {}) {
	        return new SMTPConfig(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.email = source["email"];
	        this.testTo = source["testTo"];
	        this.sendMail = source["sendMail"];
	        this.skipTLSVerify = source["skipTLSVerify"];
	    }
	}
	export class SMTPTarget {
	    port: number;
	    tls: string;
	    label: string;

	    static createFrom(source: any = {}) {
	        return new SMTPTarget(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.tls = source["tls"];
	        this.label = source["label"];
	    }
	}
	export class TestResult {
	    target: SMTPTarget;
	    success: boolean;
	    latencyMs: number;
	    serverBanner: string;
	    ehloCaps: string[];
	    tlsVersion: string;
	    certExpiry: string;
	    error: string;
	    trace: LogEntry[];

	    static createFrom(source: any = {}) {
	        return new TestResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target = this.convertValues(source["target"], SMTPTarget);
	        this.success = source["success"];
	        this.latencyMs = source["latencyMs"];
	        this.serverBanner = source["serverBanner"];
	        this.ehloCaps = source["ehloCaps"];
	        this.tlsVersion = source["tlsVersion"];
	        this.certExpiry = source["certExpiry"];
	        this.error = source["error"];
	        this.trace = this.convertValues(source["trace"], LogEntry);
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
