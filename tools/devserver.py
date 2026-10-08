"""Static dev server that tells the browser not to cache (so edited js/css load on every reload)."""
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
http.server.ThreadingHTTPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 8766), H).serve_forever()
