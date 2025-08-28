package wywd.b23toh5.Bili;

import java.io.IOException;
import okhttp3.*;

public class B23Resolver {
    private final OkHttpClient client;

    public B23Resolver() {
        client = new OkHttpClient.Builder()
                .followRedirects(true)
                .followSslRedirects(true)
                .build();
    }

    public String resolve(String url) throws IOException {
        Request req = new Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Android) B23Resolver")
                .get().build();
        try (Response resp = client.newCall(req).execute()) {
            if (!resp.isSuccessful() && resp.code() / 100 != 3) {
                throw new IOException("HTTP " + resp.code());
            }
            HttpUrl finalUrl = resp.request().url();
            return finalUrl.toString();
        }
    }
}