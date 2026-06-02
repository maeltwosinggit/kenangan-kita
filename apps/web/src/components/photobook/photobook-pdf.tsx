"use client";

import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from "@react-pdf/renderer";
import { PhotobookData } from "@kenangan/lib";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica" // Built-in standard font
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a"
  },
  branding: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2
  },
  // ── TEMPLATE STYLES ──
  heroImage: {
    width: "100%",
    height: 400,
    objectFit: "cover",
    borderRadius: 8
  },
  duoContainer: {
    flexDirection: "row",
    gap: 15,
    height: 450
  },
  duoImage: {
    flex: 1,
    height: "100%",
    objectFit: "cover",
    borderRadius: 8
  },
  mosaicContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  mosaicImage: {
    width: "48%",
    height: 200,
    objectFit: "cover",
    borderRadius: 6
  },
  scrapbookContainer: {
    position: "relative",
    height: 450
  },
  scrapbookImage: {
    position: "absolute",
    borderRadius: 4,
    borderWidth: 8,
    borderColor: "#ffffff",
    // Note: React-PDF has limited support for box-shadow and transform
    // We rely on standard absolute positioning here.
  },
  // ── STATS STYLES ──
  statsPage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 60
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 4,
    marginBottom: 20
  },
  statsValue: {
    fontSize: 48,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a"
  },
  statsSub: {
    fontSize: 14,
    color: "#475569",
    marginTop: 10
  },
  fujiStamp: {
    position: "absolute",
    bottom: 20,
    right: 20,
    fontFamily: "Courier-Bold", // Built-in monospace font
    color: "#f97316",
    fontSize: 12
  }
});

/**
 * ── PhotobookPDF Document ──
 */
export function PhotobookPDF({ data }: { data: PhotobookData }) {
  return (
    <Document title={data.title}>
      {data.pages.map((page) => (
        <Page key={page.id} size="A4" orientation="landscape" style={styles.page}>
          
          {/* Global Page Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{data.title.toUpperCase()}</Text>
            <Text style={styles.branding}>• KENANGAN KITA •</Text>
          </View>

          {/* Dynamic Templates */}
          <View style={{ flex: 1 }}>
            {page.template === "hero" && (
              <View>
                <PDFImage src={page.photos[0].imageUrl} style={styles.heroImage} />
                <Text style={styles.fujiStamp}>{formatFuji(page.photos[0])}</Text>
              </View>
            )}

            {page.template === "cover" && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <PDFImage src={page.photos[0].imageUrl} style={{ width: 280, height: 380, objectFit: "cover", borderRadius: 8, borderWidth: 8, borderColor: "#ffffff" }} />
                <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 20 }}>{page.title?.toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 10, letterSpacing: 2 }}>{page.subtitle}</Text>
              </View>
            )}

            {page.template === "opening" && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 20 }}>{page.title?.toUpperCase()}</Text>
                <PDFImage src={page.photos[0].imageUrl} style={{ width: "100%", height: 350, objectFit: "cover", borderRadius: 8 }} />
              </View>
            )}

            {page.template === "duo" && (
              <View style={styles.duoContainer}>
                {page.photos.map((p, i) => (
                  <View key={p.id} style={{ flex: 1 }}>
                    <PDFImage src={p.imageUrl} style={styles.duoImage} />
                    <Text style={styles.fujiStamp}>{formatFuji(p)}</Text>
                  </View>
                ))}
              </View>
            )}

            {page.template === "trio" && (
              <View style={{ flexDirection: "row", gap: 10, height: 450 }}>
                <View style={{ flex: 2 }}>
                   <PDFImage src={page.photos[0].imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                   <Text style={styles.fujiStamp}>{formatFuji(page.photos[0])}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: "column", gap: 10 }}>
                   <View style={{ flex: 1, position: "relative" }}>
                     <PDFImage src={page.photos[1].imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                   </View>
                   {page.photos[2] && (
                     <View style={{ flex: 1, position: "relative" }}>
                       <PDFImage src={page.photos[2].imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                     </View>
                   )}
                </View>
              </View>
            )}

            {page.template === "collage" && (
              <View style={styles.mosaicContainer}>
                {page.photos.map((p) => (
                  <View key={p.id} style={{ width: "48%", height: 200, position: "relative" }}>
                    <PDFImage src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                  </View>
                ))}
              </View>
            )}

            {page.template === "scrapbook" && (
              <View style={styles.scrapbookContainer}>
                {page.photos.map((p, i) => {
                  const offsets = [
                    { top: 0, left: 0, width: 350, transform: "rotate(-2deg)" },
                    { top: 50, left: 380, width: 320, transform: "rotate(3deg)" },
                    { top: 220, left: 80, width: 300, transform: "rotate(-1deg)" },
                  ];
                  const style = offsets[i % offsets.length];
                  return (
                    <View key={p.id} style={{ 
                      ...styles.scrapbookImage, 
                      top: style.top, 
                      left: style.left, 
                      width: style.width,
                      // @ts-ignore
                      transform: style.transform 
                    }}>
                       <PDFImage src={p.imageUrl} style={{ width: "100%", height: 240, objectFit: "cover" }} />
                       <Text style={{ fontSize: 8, color: "#f97316", marginTop: 4, fontFamily: "Courier-Bold" }}>{formatFuji(p)}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {page.template === "back" && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>{page.title?.toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 20, letterSpacing: 4 }}>{page.subtitle}</Text>
              </View>
            )}

            {page.template === "stats" && renderStats(page.stats)}
          </View>

          {/* Footer Page Number */}
          <Text style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "#94a3b8" }}>
            {data.title} — Digital Souvenir
          </Text>

        </Page>
      ))}
    </Document>
  );
}

function formatFuji(photo: any) {
  if (!photo || !photo.captured_at) return "";
  const d = new Date(photo.captured_at);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString().replace(/\//g, ".")} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function renderStats(stats: any) {
  if (stats.type === "early-bird") {
    return (
      <View style={styles.statsPage}>
        <Text style={styles.statsTitle}>The Early Bird</Text>
        <Text style={styles.statsSub}>First memory captured by</Text>
        <Text style={styles.statsValue}>{stats.photo?.nickname || "A Guest"}</Text>
        <View style={{ marginTop: 40, flexDirection: "row", gap: 30 }}>
           <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalPhotos}</Text>
              <Text style={{ fontSize: 10, color: "#94a3b8" }}>MEMORIES</Text>
           </View>
           <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: 700 }}>{stats.guestCount}</Text>
              <Text style={{ fontSize: 10, color: "#94a3b8" }}>GUESTS</Text>
           </View>
        </View>
      </View>
    );
  }

  if (stats.type === "peak-hour") {
    return (
      <View style={styles.statsPage}>
        <Text style={styles.statsTitle}>The Rush Hour</Text>
        <Text style={styles.statsSub}>Most memories were made at</Text>
        <Text style={styles.statsValue}>{stats.data.hour}:00</Text>
        <Text style={styles.statsSub}>with {stats.data.count} photos taken in 60 minutes.</Text>
      </View>
    );
  }

  if (stats.type === "contributors") {
    return (
      <View style={styles.statsPage}>
        <Text style={styles.statsTitle}>Top Contributors</Text>
        <View style={{ width: "70%", marginTop: 20 }}>
          {stats.data.map((c: any, i: number) => {
            const maxCount = stats.data[0].count;
            const percentage = (c.count / maxCount) * 100;
            return (
              <View key={i} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{c.name.toUpperCase()}</Text>
                  <Text style={{ fontSize: 9, color: "#94a3b8" }}>{c.count}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                   <View style={{ height: 4, backgroundColor: "#0f172a", borderRadius: 2, width: `${percentage}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  if (stats.type === "summary") {
    return (
      <View style={styles.statsPage}>
        <Text style={styles.statsTitle}>The Final Count</Text>
        <View style={{ marginTop: 20, flexDirection: "row", gap: 50 }}>
           <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 36, fontFamily: "Helvetica-Bold" }}>{stats.totalPhotos}</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>MEMORIES</Text>
           </View>
           <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 36, fontFamily: "Helvetica-Bold" }}>{stats.guestCount}</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>GUESTS</Text>
           </View>
        </View>
      </View>
    );
  }

  return null;
}
