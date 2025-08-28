package wywd.b23toh5.Bili;

import com.google.gson.*;
import java.io.IOException;
import okhttp3.*;

public class BiliApi {
    private final OkHttpClient client;
    private final Gson gson = new Gson();

    public static class VideoInfo {
        public long aid;
        public String bvid;
        public long cid;
    }

    public BiliApi(OkHttpClient client) {
        this.client = client;
    }

    public VideoInfo fetchByBvid(String bvid) throws IOException {
        String api = "https://api.bilibili.com/x/web-interface/view?bvid=" + bvid;
        Request req = new Request.Builder()
                .url(api)
                .header("User-Agent", "Mozilla/5.0 (Android) BiliApi")
                .get().build();
        try (Response resp = client.newCall(req).execute()) {
            if (!resp.isSuccessful()) throw new IOException("HTTP " + resp.code());
            JsonObject root = JsonParser.parseString(resp.body().string()).getAsJsonObject();
            JsonObject data = root.getAsJsonObject("data");
            VideoInfo vi = new VideoInfo();
            vi.aid = data.get("aid").getAsLong();
            vi.bvid = data.get("bvid").getAsString();
            JsonArray pages = data.getAsJsonArray("pages");
            if (pages != null && pages.size() > 0) {
                vi.cid = pages.get(0).getAsJsonObject().get("cid").getAsLong();
            }
            return vi;
        }
    }

    public static String extractBvid(String url) {
        String u = url;
        int idx = u.indexOf("BV");
        if (idx >= 0) {
            String sub = u.substring(idx);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < sub.length(); i++) {
                char c = sub.charAt(i);
                if (Character.isLetterOrDigit(c)) sb.append(c);
                else break;
            }
            return sb.toString();
        }
        return null;
    }
}