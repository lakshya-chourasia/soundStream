package com.soundstream.music;

import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

public class NativeMediaApi {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    public static WebResourceResponse handleSearch(String rawQuery) {
        if (rawQuery == null) rawQuery = "";
        rawQuery = rawQuery.trim();

        try {
            String query = rawQuery.toLowerCase().matches(".*(official|video|audio|lyrics).*") 
                ? rawQuery 
                : rawQuery + " official music video";

            String searchUrl = "https://www.youtube.com/results?search_query=" + URLEncoder.encode(query, "UTF-8");
            URL url = new URL(searchUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", USER_AGENT);
            conn.setRequestProperty("Accept-Language", "en-US,en;q=0.9");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);

            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder html = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    html.append(line);
                }
                reader.close();

                Pattern pattern = Pattern.compile("ytInitialData\\s*=\\s*(\\{.+?\\});");
                Matcher matcher = pattern.matcher(html);
                if (matcher.find()) {
                    String jsonStr = matcher.group(1);
                    JSONObject ytData = new JSONObject(jsonStr);

                    JSONArray tracks = parseTracksFromYtData(ytData);
                    if (tracks.length() > 0) {
                        JSONObject result = new JSONObject();
                        result.put("tracks", tracks);
                        return jsonResponse(result.toString());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Fallback response with popular tracks if search network fails
        return jsonResponse(getFallbackSearchJson(rawQuery));
    }

    public static WebResourceResponse handleSuggest(String query) {
        if (query == null) query = "";
        try {
            String suggestUrl = "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=" + URLEncoder.encode(query, "UTF-8");
            URL url = new URL(suggestUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", USER_AGENT);
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);

            if (conn.getResponseCode() == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder resp = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    resp.append(line);
                }
                reader.close();

                JSONArray arr = new JSONArray(resp.toString());
                JSONArray suggestions = arr.optJSONArray(1);
                JSONObject out = new JSONObject();
                out.put("suggestions", suggestions != null ? suggestions : new JSONArray());
                return jsonResponse(out.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return jsonResponse("{\"suggestions\":[]}");
    }

    private static JSONArray parseTracksFromYtData(JSONObject ytData) {
        JSONArray result = new JSONArray();
        try {
            JSONObject contents = ytData.optJSONObject("contents");
            if (contents == null) return result;
            JSONObject twoCol = contents.optJSONObject("twoColumnSearchResultsRenderer");
            if (twoCol == null) return result;
            JSONObject primary = twoCol.optJSONObject("primaryContents");
            if (primary == null) return result;
            JSONObject sectionList = primary.optJSONObject("sectionListRenderer");
            if (sectionList == null) return result;
            JSONArray sections = sectionList.optJSONArray("contents");
            if (sections == null) return result;

            for (int s = 0; s < sections.length(); s++) {
                JSONObject sec = sections.optJSONObject(s);
                if (sec == null) continue;
                JSONObject itemSec = sec.optJSONObject("itemSectionRenderer");
                if (itemSec == null) continue;
                JSONArray items = itemSec.optJSONArray("contents");
                if (items == null) continue;

                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.optJSONObject(i);
                    if (item == null) continue;
                    JSONObject vr = item.optJSONObject("videoRenderer");
                    if (vr == null) continue;

                    String videoId = vr.optString("videoId", "");
                    if (videoId.length() != 11) continue;

                    // Title
                    String title = "Unknown Title";
                    JSONObject titleObj = vr.optJSONObject("title");
                    if (titleObj != null) {
                        JSONArray runs = titleObj.optJSONArray("runs");
                        if (runs != null && runs.length() > 0) {
                            title = runs.optJSONObject(0).optString("text", title);
                        } else {
                            title = titleObj.optString("simpleText", title);
                        }
                    }

                    // Artist / Channel
                    String artist = "YouTube Music";
                    JSONObject ownerObj = vr.optJSONObject("ownerText");
                    if (ownerObj != null) {
                        JSONArray runs = ownerObj.optJSONArray("runs");
                        if (runs != null && runs.length() > 0) {
                            artist = runs.optJSONObject(0).optString("text", artist);
                        }
                    }

                    // Duration
                    String duration = "3:30";
                    JSONObject lengthObj = vr.optJSONObject("lengthText");
                    if (lengthObj != null) {
                        duration = lengthObj.optString("simpleText", duration);
                    }

                    // Thumbnail
                    String thumb = "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg";
                    JSONObject thumbObj = vr.optJSONObject("thumbnail");
                    if (thumbObj != null) {
                        JSONArray thumbs = thumbObj.optJSONArray("thumbnails");
                        if (thumbs != null && thumbs.length() > 0) {
                            thumb = thumbs.optJSONObject(thumbs.length() - 1).optString("url", thumb);
                        }
                    }

                    JSONObject track = new JSONObject();
                    track.put("id", videoId);
                    track.put("title", title);
                    track.put("artist", artist);
                    track.put("duration", duration);
                    track.put("durationSec", 210);
                    track.put("thumbnail", thumb);

                    result.put(track);
                    if (result.length() >= 20) return result;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    private static String getFallbackSearchJson(String query) {
        return "{\"tracks\":["
            + "{\"id\":\"4NRXx6U8ABQ\",\"title\":\"Blinding Lights\",\"artist\":\"The Weeknd\",\"duration\":\"4:22\",\"durationSec\":262,\"thumbnail\":\"https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg\"},"
            + "{\"id\":\"2Vv-BfVoq4g\",\"title\":\"Perfect\",\"artist\":\"Ed Sheeran\",\"duration\":\"4:23\",\"durationSec\":263,\"thumbnail\":\"https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg\"},"
            + "{\"id\":\"yKNxeF4KMsY\",\"title\":\"Yellow\",\"artist\":\"Coldplay\",\"duration\":\"4:33\",\"durationSec\":273,\"thumbnail\":\"https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg\"},"
            + "{\"id\":\"H5v3kku4y6Q\",\"title\":\"As It Was\",\"artist\":\"Harry Styles\",\"duration\":\"2:47\",\"durationSec\":167,\"thumbnail\":\"https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg\"},"
            + "{\"id\":\"TUVcZfQe-Kw\",\"title\":\"Levitating\",\"artist\":\"Dua Lipa\",\"duration\":\"3:50\",\"durationSec\":230,\"thumbnail\":\"https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg\"}"
            + "]}";
    }

    private static WebResourceResponse jsonResponse(String json) {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Content-Type", "application/json; charset=utf-8");
        return new WebResourceResponse("application/json", "UTF-8", 200, "OK", headers, new ByteArrayInputStream(bytes));
    }
}
