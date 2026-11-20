package com.soundstream.music;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import com.getcapacitor.CapacitorWebView;

public class MelophileWebView extends CapacitorWebView {

    public MelophileWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // ALWAYS keep Window visibility reported as VISIBLE so Chromium's media
        // decoders and JavaScript execution never freeze when minimized or screen locked.
        super.onWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    public void onPause() {
        // Suppress onPause to prevent Chromium from pausing HTML5 audio/video decoders
    }

    @Override
    public void pauseTimers() {
        // Suppress pauseTimers so JavaScript timers and background audio keep ticking
    }
}
