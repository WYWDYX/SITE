package wywd.b23toh5.Bili;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Patterns;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewPropertyAnimator;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.airbnb.lottie.LottieAnimationView;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import okhttp3.OkHttpClient;

public class MainActivity extends AppCompatActivity {

    private TextInputEditText etUrl;
    private WebView web;
    private LottieAnimationView loading;
    private MaterialToolbar topBar;

    private MaterialCardView cardInput;
    private MaterialCardView cardResult;
    private MaterialCardView cardPlayer;

    private TextInputEditText etPlayerLink;
    private MaterialButton btnCopy;
    private MaterialButton btnShareBtn;
    private MaterialButton btnDetails;

    private MaterialButton btnParse;

    private final OkHttpClient ok = new OkHttpClient.Builder()
            .followRedirects(true).followSslRedirects(true).build();

    private final ExecutorService exec = Executors.newSingleThreadExecutor();

    private String lastPlayerUrl = null;
    private String lastCombinedText = null;

    private ClipboardManager clipboardManager;
    private ClipboardManager.OnPrimaryClipChangedListener clipListener;
    private String lastClipboardText = "";
    
    private SharedPreferences preferences;
    private boolean autoShareEnabled = false;

    private static final Pattern URL_PATTERN = Patterns.WEB_URL;
    private static final Pattern BILIBILI_PATTERN = Pattern.compile("(https?://(www\\.)?bilibili\\.com/video/[^\\s]+)|(https?://b23\\.tv/[^\\s]+)");

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        setStatusBarColor();

        preferences = getSharedPreferences("app_settings", MODE_PRIVATE);
        autoShareEnabled = preferences.getBoolean("auto_share", false);
        
        boolean isFirstRun = preferences.getBoolean("first_run", true);
        if (isFirstRun) {
            showWelcomeDialog();
            preferences.edit().putBoolean("first_run", false).apply();
        }

        etUrl = findViewById(R.id.etUrl);
        web = findViewById(R.id.web);
        loading = findViewById(R.id.loading);
        topBar = findViewById(R.id.topBar);

        cardInput = findViewById(R.id.cardInput);
        cardResult = findViewById(R.id.cardResult);
        cardPlayer = findViewById(R.id.cardPlayer);

        etPlayerLink = findViewById(R.id.etPlayerLink);
        btnCopy = findViewById(R.id.btnCopy);
        btnShareBtn = findViewById(R.id.btnShare);
        btnDetails = findViewById(R.id.btnDetails);

        btnParse = findViewById(R.id.btnParse);

        setSupportActionBar(topBar);
        topBar.setOnMenuItemClickListener(this::onMenuClick);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override 
            public void onPageFinished(WebView view, String url) {
                fadeIn(web);
                stopLoading();
            }
        });

        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        clipListener = this::onClipboardChanged;

        setupResultControls();

        handleIncomingIntent(getIntent());

        checkClipboardOnStartup();
        
        btnDetails.setOnClickListener(v -> showInfoDialog());

        btnParse.setOnClickListener(v -> {
            String input = String.valueOf(etUrl.getText()).trim();
            if (input.isEmpty()) {
                toast("请输入或粘贴链接/分享文本");
                return;
            }
            handleTextInputAndParse(input);
        });
    }

    private void setStatusBarColor() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(ContextCompat.getColor(this, R.color.statusBar));
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(decorView.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        try {
            if (clipboardManager != null && clipListener != null) {
                clipboardManager.addPrimaryClipChangedListener(clipListener);
            }
        } catch (Exception ignored) {}
        
        checkClipboardOnResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            if (clipboardManager != null && clipListener != null) {
                clipboardManager.removePrimaryClipChangedListener(clipListener);
            }
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIncomingIntent(intent);
    }

    private void showWelcomeDialog() {
        new AlertDialog.Builder(this)
                .setTitle("欢迎使用 Bili短链解析")
                .setMessage("本应用用于解析B站视频链接并生成播放器直链\n\n" +
                           "使用说明：\n" +
                           "1. 复制B站视频链接后打开应用即可自动解析\n" +
                           "2. 也可以从其他应用分享文本到本应用\n" +
                           "3. 解析完成后会自动复制到剪贴板\n\n" +
                           "版本: 1.0.0\n" +
                           "开发者: WYWDYX")
                .setPositiveButton("确定", null)
                .show();
    }

    private void showInfoDialog() {
        new AlertDialog.Builder(this)
                .setTitle("关于 Bili短链解析")
                .setMessage("B站视频链接解析工具\n\n" +
                           "功能特点：\n" +
                           "- 自动识别剪贴板中的B站链接\n" +
                           "- 支持b23.tv短链接解析\n" +
                           "- 生成可直接播放的链接\n" +
                           "- 自动复制解析结果\n\n" +
                           "版本: 1.0.0\n" +
                           "开发者: WYWDYX")
                .setPositiveButton("确定", null)
                .show();
    }

    private void showModeDialog() {
        String[] modes = {"自动复制解析结果", "自动分享解析结果"};
        boolean[] checkedItems = {true, autoShareEnabled};
        
        new AlertDialog.Builder(this)
                .setTitle("选择模式")
                .setMultiChoiceItems(modes, checkedItems, (dialog, which, isChecked) -> {
                    if (which == 1) {
                        autoShareEnabled = isChecked;
                        preferences.edit().putBoolean("auto_share", autoShareEnabled).apply();
                    }
                })
                .setPositiveButton("确定", null)
                .show();
    }

    private void checkClipboardOnStartup() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) return;
            
            ClipData cd = clipboardManager.getPrimaryClip();
            if (cd == null || cd.getItemCount() == 0) return;
            
            CharSequence cs = cd.getItemAt(0).coerceToText(this);
            if (cs == null) return;
            
            final String text = cs.toString().trim();
            if (text.isEmpty()) return;
            
            String found = extractBiliRelevantUrl(text);
            if (found != null) {
                etUrl.setText(text);
                handleTextInputAndParse(text);
            }
        } catch (Exception e) {
        }
    }

    private void checkClipboardOnResume() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) return;
            
            ClipData cd = clipboardManager.getPrimaryClip();
            if (cd == null || cd.getItemCount() == 0) return;
            
            CharSequence cs = cd.getItemAt(0).coerceToText(this);
            if (cs == null) return;
            
            final String text = cs.toString().trim();
            if (text.isEmpty()) return;
            
            if (text.equals(lastClipboardText)) return;
            lastClipboardText = text;
            
            String found = extractBiliRelevantUrl(text);
            if (found != null) {
                etUrl.setText(text);
                handleTextInputAndParse(text);
            }
        } catch (Exception e) {
        }
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null && type.startsWith("text/")) {
            CharSequence shared = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (shared != null) {
                String txt = shared.toString().trim();
                handleTextInputAndParse(txt);
                return;
            }
        }

        Uri data = intent.getData();
        if (data != null) {
            String url = data.toString();
            handleTextInputAndParse(url);
        }
    }

    private void handleTextInputAndParse(String inputText) {
        if (inputText == null) return;
        String normalized = inputText.trim();
        if (normalized.isEmpty()) return;

        String foundUrl = extractBiliRelevantUrl(normalized);
        if (foundUrl == null) {
            toast("未检测到 b23.tv 或 bilibili 视频链接");
            return;
        }

        etUrl.setText(normalized);

        exec.submit(() -> {
            try {
                String resolvedUrl = foundUrl;
                if (resolvedUrl.contains("b23.tv/")) {
                    resolvedUrl = new B23Resolver().resolve(resolvedUrl);
                }

                String bvid = BiliApi.extractBvid(resolvedUrl);
                if (bvid == null) {
                    throw new IOException("未识别到 BV/AV");
                }

                BiliApi api = new BiliApi(ok);
                BiliApi.VideoInfo vi = api.fetchByBvid(bvid);
                String playerUrl = MbPlayerUrl.build(vi.aid, vi.bvid, vi.cid);

                final String replaced = normalized.replaceFirst(Pattern.quote(foundUrl), Matcher.quoteReplacement(playerUrl));

                runOnUiThread(() -> {
                    lastPlayerUrl = playerUrl;
                    lastCombinedText = replaced;

                    cardResult.setVisibility(View.VISIBLE);
                    etPlayerLink.setText(replaced);

                    if (cardPlayer.getVisibility() != View.VISIBLE) {
                        cardPlayer.setAlpha(0f);
                        cardPlayer.setTranslationY(10f);
                        cardPlayer.setVisibility(View.VISIBLE);
                        cardPlayer.animate().alpha(1f).translationYBy(-10f).setDuration(260).start();
                    }
                    web.loadUrl(playerUrl);
                    stopLoading();
                    
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    cm.setPrimaryClip(ClipData.newPlainText("mbplayer", replaced));
                    toast("解析完成，已复制到剪贴板");
                    
                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle("解析完成")
                            .setMessage("B站视频链接已成功解析并复制到剪贴板")
                            .setPositiveButton("确定", null)
                            .show();
                    
                    if (autoShareEnabled) {
                        Intent i = new Intent(Intent.ACTION_SEND);
                        i.setType("text/plain");
                        i.putExtra(Intent.EXTRA_TEXT, replaced);
                        startActivity(Intent.createChooser(i, "分享播放器链接"));
                    }
                });

            } catch (final Exception e) {
                runOnUiThread(() -> {
                    stopLoading();
                    toast("解析失败：" + e.getMessage());
                });
            }
        });

        startLoading();
    }

    private String extractBiliRelevantUrl(String text) {
        if (text == null) return null;
        
        Matcher m = BILIBILI_PATTERN.matcher(text);
        while (m.find()) {
            String candidate = m.group();
            if (candidate == null) continue;
            
            if (candidate.contains("blackboard/webplayer") || candidate.contains("mbplayer")) {
                continue;
            }
            
            if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
                candidate = "https://" + candidate;
            }
            return candidate;
        }
        return null;
    }

    private void onClipboardChanged() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) return;
            ClipData cd = clipboardManager.getPrimaryClip();
            if (cd == null || cd.getItemCount() == 0) return;
            CharSequence cs = cd.getItemAt(0).coerceToText(this);
            if (cs == null) return;
            final String text = cs.toString().trim();
            if (text.isEmpty()) return;

            if (text.equals(lastClipboardText)) return;
            lastClipboardText = text;

            String found = extractBiliRelevantUrl(text);
            if (found != null) {
                runOnUiThread(() -> {
                    etUrl.setText(text);
                    handleTextInputAndParse(text);
                });
            }
        } catch (Exception ignored) {}
    }

    private void setupResultControls() {
        btnCopy.setOnClickListener(v -> {
            String toCopy = (lastCombinedText != null && !lastCombinedText.isEmpty()) ? lastCombinedText
                    : (lastPlayerUrl != null ? lastPlayerUrl : "");
            if (toCopy.isEmpty()) { toast("当前没有链接可复制"); return; }
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            cm.setPrimaryClip(ClipData.newPlainText("mbplayer", toCopy));
            toast("已复制到剪贴板");
        });

        btnShareBtn.setOnClickListener(v -> {
            String toShare = (lastCombinedText != null && !lastCombinedText.isEmpty()) ? lastCombinedText
                    : (lastPlayerUrl != null ? lastPlayerUrl : "");
            if (toShare.isEmpty()) { toast("当前没有链接可分享"); return; }
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_TEXT, toShare);
            startActivity(Intent.createChooser(i, "分享播放器链接"));
        });

        etPlayerLink.setOnClickListener(v -> {
            if (lastPlayerUrl == null || lastPlayerUrl.isEmpty()) return;
            try {
                Intent in = new Intent(Intent.ACTION_VIEW, Uri.parse(lastPlayerUrl));
                startActivity(in);
            } catch (Exception ignored) {}
        });
    }

    private boolean onMenuClick(@NonNull MenuItem item) {
        int id = item.getItemId();
        if (id == R.id.action_paste) {
            String u = readClipboardUrl();
            if (u != null) etUrl.setText(u);
            else toast("剪贴板没有链接");
            return true;
        } else if (id == R.id.action_share) {
            if (lastCombinedText == null && lastPlayerUrl == null) { toast("还没有可分享的链接"); return true; }
            String toShare = (lastCombinedText != null && !lastCombinedText.isEmpty()) ? lastCombinedText : lastPlayerUrl;
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_TEXT, toShare);
            startActivity(Intent.createChooser(i, "分享播放器链接"));
            return true;
        } else if (id == R.id.action_copy) {
            if (lastCombinedText == null && lastPlayerUrl == null) { toast("还没有可复制的链接"); return true; }
            String toCopy = (lastCombinedText != null && !lastCombinedText.isEmpty()) ? lastCombinedText : lastPlayerUrl;
            ClipboardManager cm = (ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);
            cm.setPrimaryClip(ClipData.newPlainText("mbplayer", toCopy));
            toast("已复制");
            return true;
        } else if (id == R.id.action_reload) {
            String input = String.valueOf(etUrl.getText()).trim();
            if (!input.isEmpty()) handleTextInputAndParse(input);
            return true;
        } else if (id == R.id.action_mode) {
            showModeDialog();
            return true;
        } else if (id == R.id.action_info) {
            showInfoDialog();
            return true;
        }
        return false;
    }

    private void startLoading() {
        loading.setVisibility(View.VISIBLE);
        loading.playAnimation();
        cardResult.setVisibility(View.GONE);
        cardPlayer.setVisibility(View.GONE);
    }

    private void stopLoading() {
        try { loading.cancelAnimation(); } catch (Exception ignored) {}
        loading.setVisibility(View.GONE);
    }

    private void fadeIn(View v) {
        v.setVisibility(View.VISIBLE);
        ViewPropertyAnimator a = v.animate().alpha(1f).setDuration(220);
        a.start();
    }

    private String readClipboardUrl() {
        try {
            if (clipboardManager == null || !clipboardManager.hasPrimaryClip()) return null;
            ClipData cd = clipboardManager.getPrimaryClip();
            if (cd == null || cd.getItemCount() == 0) return null;
            CharSequence cs = cd.getItemAt(0).coerceToText(this);
            if (cs == null) return null;
            String s = cs.toString().trim();
            String url = extractBiliRelevantUrl(s);
            return url;
        } catch (Exception e) {
            return null;
        }
    }

    private void toast(final String s) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, s, Toast.LENGTH_SHORT).show());
    }

    @Override
    protected void onDestroy() {
        try { exec.shutdownNow(); } catch (Exception ignored) {}
        if (web != null) {
            try {
                web.loadUrl("about:blank");
                web.stopLoading();
                web.setWebChromeClient(null);
                web.setWebViewClient(null);
                web.destroy();
            } catch (Exception ignored) {
            } finally {
                web = null;
            }
        }
        super.onDestroy();
    }
}