package com.soundstream.music;

import android.app.PictureInPictureParams;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    public static volatile MainActivity instance;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;

        // Start Foreground Media Service while in foreground
        startBackgroundAudioService();

        // Configure WebView settings & native bridges
        try {
            Bridge bridge = this.getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
                    WebSettings settings = webView.getSettings();
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);
                    settings.setDatabaseEnabled(true);
                    settings.setAllowFileAccess(true);
                    settings.setAllowContentAccess(true);

                    // Keep desktop user agent so YouTube iframe doesn't pause when backgrounded
                    String desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Melophile/1.0";
                    settings.setUserAgentString(desktopUA);

                    // Add JavaScript Interface for syncing track info to the Notification Mini Player
                    webView.addJavascriptInterface(new Object() {
                        @JavascriptInterface
                        public void updateTrack(String title, String artist, String artworkUrl, boolean isPlaying) {
                            try {
                                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                                intent.setAction(BackgroundAudioService.ACTION_UPDATE_TRACK);
                                intent.putExtra("title", title);
                                intent.putExtra("artist", artist);
                                intent.putExtra("artwork", artworkUrl);
                                intent.putExtra("isPlaying", isPlaying);
                                MainActivity.this.startService(intent);
                            } catch (Exception ignored) {}
                        }
                    }, "AndroidMediaBridge");
                }

                // Intercept /api/search and /api/suggest so search works directly offline & in APK
                bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        Uri url = request.getUrl();
                        if (url != null && url.getPath() != null) {
                            String path = url.getPath();
                            if (path.equals("/api/search") || path.endsWith("/api/search")) {
                                String q = url.getQueryParameter("q");
                                return NativeMediaApi.handleSearch(q);
                            }
                            if (path.equals("/api/suggest") || path.endsWith("/api/suggest")) {
                                String q = url.getQueryParameter("q");
                                return NativeMediaApi.handleSuggest(q);
                            }
                        }
                        return super.shouldInterceptRequest(view, request);
                    }
                });
            }
        } catch (Exception ignored) {}
    }

    public static void dispatchMediaAction(String action) {
        if (instance != null) {
            instance.runOnUiThread(() -> {
                try {
                    WebView webView = instance.getBridge().getWebView();
                    if (webView != null) {
                        webView.evaluateJavascript("window.__melophileMediaAction && window.__melophileMediaAction('" + action + "')", null);
                    }
                } catch (Exception ignored) {}
            });
        }
    }

    private void keepWebViewAlive() {
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.onResume();
                webView.resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    private void startBackgroundAudioService() {
        try {
            Intent serviceIntent = new Intent(this, BackgroundAudioService.class);
            serviceIntent.setAction(BackgroundAudioService.ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(this, serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception ignored) {}
    }

    private void stopBackgroundAudioService() {
        try {
            Intent serviceIntent = new Intent(this, BackgroundAudioService.class);
            serviceIntent.setAction(BackgroundAudioService.ACTION_STOP);
            startService(serviceIntent);
        } catch (Exception ignored) {}
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Seamlessly enter Picture-in-Picture when user minimizes app (Home or app switch)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                PictureInPictureParams params = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(16, 9))
                    .build();
                enterPictureInPictureMode(params);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        instance = this;
        keepWebViewAlive();
    }

    @Override
    public void onPause() {
        super.onPause();
        keepWebViewAlive();
    }

    @Override
    public void onStop() {
        super.onStop();
        keepWebViewAlive();
    }

    @Override
    public void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        stopBackgroundAudioService();
        super.onDestroy();
    }
}
