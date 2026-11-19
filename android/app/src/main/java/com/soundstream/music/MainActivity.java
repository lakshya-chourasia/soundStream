package com.soundstream.music;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView to allow continuous background audio playback
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setMediaPlaybackRequiresUserGesture(false);
                // Keep desktop user agent so YouTube iframe doesn't pause when backgrounded
                String desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Melophile/1.0";
                settings.setUserAgentString(desktopUA);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        // Resume webview timers so audio keeps decoding when minimized or phone screen turns off
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
            }
        } catch (Exception ignored) {}
    }
}
