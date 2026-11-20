package com.soundstream.music;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class BackgroundAudioService extends Service {
    public static final String ACTION_START = "com.soundstream.music.action.START";
    public static final String ACTION_STOP = "com.soundstream.music.action.STOP";
    public static final String ACTION_UPDATE_TRACK = "com.soundstream.music.action.UPDATE_TRACK";
    public static final String ACTION_TOGGLE = "com.soundstream.music.action.TOGGLE";
    public static final String ACTION_NEXT = "com.soundstream.music.action.NEXT";
    public static final String ACTION_PREV = "com.soundstream.music.action.PREV";

    private static final String CHANNEL_ID = "melophile_media_playback";
    private static final int NOTIFICATION_ID = 4040;

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;

    private String currentTitle = "Melophile";
    private String currentArtist = "Playing in background";
    private String currentArtworkUrl = "";
    private boolean isPlaying = true;
    private Bitmap currentArtworkBitmap = null;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Melophile Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active playback controls in notifications");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP.equals(action)) {
                stopForegroundService();
                return START_NOT_STICKY;
            } else if (ACTION_TOGGLE.equals(action)) {
                MainActivity.dispatchMediaAction("toggle");
                return START_STICKY;
            } else if (ACTION_NEXT.equals(action)) {
                MainActivity.dispatchMediaAction("next");
                return START_STICKY;
            } else if (ACTION_PREV.equals(action)) {
                MainActivity.dispatchMediaAction("prev");
                return START_STICKY;
            } else if (ACTION_UPDATE_TRACK.equals(action)) {
                String title = intent.getStringExtra("title");
                String artist = intent.getStringExtra("artist");
                String artwork = intent.getStringExtra("artwork");
                boolean playing = intent.getBooleanExtra("isPlaying", isPlaying);

                if (title != null && !title.isEmpty()) currentTitle = title;
                if (artist != null && !artist.isEmpty()) currentArtist = artist;
                isPlaying = playing;

                if (artwork != null && !artwork.equals(currentArtworkUrl)) {
                    currentArtworkUrl = artwork;
                    loadArtworkAsync(artwork);
                } else {
                    updateNotificationUI();
                }
                return START_STICKY;
            }
        }

        startForegroundPlayback();
        return START_STICKY;
    }

    private void loadArtworkAsync(String artworkUrl) {
        new Thread(() -> {
            try {
                URL url = new URL(artworkUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.setConnectTimeout(4000);
                connection.setReadTimeout(4000);
                connection.connect();
                InputStream input = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);
                if (bitmap != null) {
                    currentArtworkBitmap = bitmap;
                }
            } catch (Exception ignored) {
            } finally {
                updateNotificationUI();
            }
        }).start();
    }

    private void startForegroundPlayback() {
        try {
            Notification notification = buildNotification();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            acquireLocks();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateNotificationUI() {
        try {
            Notification notification = buildNotification();
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, notification);
            }
        } catch (Exception ignored) {}
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentPendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, pendingFlags);

        // Media Action Intents
        Intent prevIntent = new Intent(this, BackgroundAudioService.class).setAction(ACTION_PREV);
        PendingIntent pPrev = PendingIntent.getService(this, 101, prevIntent, pendingFlags);

        Intent toggleIntent = new Intent(this, BackgroundAudioService.class).setAction(ACTION_TOGGLE);
        PendingIntent pToggle = PendingIntent.getService(this, 102, toggleIntent, pendingFlags);

        Intent nextIntent = new Intent(this, BackgroundAudioService.class).setAction(ACTION_NEXT);
        PendingIntent pNext = PendingIntent.getService(this, 103, nextIntent, pendingFlags);

        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseTitle = isPlaying ? "Pause" : "Play";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentPendingIntent)
            .setOngoing(isPlaying)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_media_previous, "Previous", pPrev)
            .addAction(playPauseIcon, playPauseTitle, pToggle)
            .addAction(android.R.drawable.ic_media_next, "Next", pNext)
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setShowActionsInCompactView(0, 1, 2));

        if (currentArtworkBitmap != null) {
            builder.setLargeIcon(currentArtworkBitmap);
        }

        return builder.build();
    }

    private void acquireLocks() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Melophile::AudioPlaybackWakeLock");
                    wakeLock.setReferenceCounted(false);
                }
            }
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(12 * 60 * 60 * 1000L); // 12 hours
            }

            if (wifiLock == null) {
                WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wm != null) {
                    wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "Melophile::WifiStreamLock");
                    wifiLock.setReferenceCounted(false);
                }
            }
            if (wifiLock != null && !wifiLock.isHeld()) {
                wifiLock.acquire();
            }
        } catch (Exception ignored) {}
    }

    private void releaseLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
        try {
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
            }
        } catch (Exception ignored) {}
    }

    private void stopForegroundService() {
        releaseLocks();
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        releaseLocks();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
