package com.soundstream.music;

import android.app.PictureInPictureParams;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Start Foreground Media Service while in foreground to ensure OS permission
        startBackgroundAudioService();

        // Configure WebView to allow continuous background audio playback
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                // Keep desktop user agent so YouTube iframe doesn't pause when backgrounded
                String desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Melophile/1.0";
                settings.setUserAgentString(desktopUA);
            }
        } catch (Exception ignored) {}
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
        stopBackgroundAudioService();
        super.onDestroy();
    }
}
