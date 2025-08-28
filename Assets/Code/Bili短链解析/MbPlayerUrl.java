package wywd.b23toh5.Bili;

public class MbPlayerUrl {
    public static String build(long aid, String bvid, long cid) {
        return "https://www.bilibili.com/blackboard/webplayer/mbplayer.html"
                + "?aid=" + (aid > 0 ? aid : "")
                + "&bvid=" + (bvid != null ? bvid : "")
                + "&cid=" + (cid > 0 ? cid : "")
                + "&page=1&high_quality=1&danmaku=0";
    }
}