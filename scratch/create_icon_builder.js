const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');

const csContent = `using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

namespace JawalangIconBuilder
{
    class Program
    {
        static void Main(string[] args)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            // Target assets/jawalang.ico
            string projectRoot = Path.GetFullPath(Path.Combine(baseDir, ".."));
            string outIco = Path.Combine(projectRoot, "assets", "jawalang.ico");

            int[] sizes = new int[] { 16, 24, 32, 48, 64, 128, 256 };
            var pngEntries = new List<KeyValuePair<int, byte[]>>();

            foreach (int size in sizes)
            {
                using (Bitmap bmp = DrawJawalang(size))
                using (MemoryStream ms = new MemoryStream())
                {
                    bmp.Save(ms, ImageFormat.Png);
                    pngEntries.Add(new KeyValuePair<int, byte[]>(size, ms.ToArray()));
                }
            }

            // Write binary ICO file
            using (FileStream fs = new FileStream(outIco, FileMode.Create, FileAccess.Write))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                // ICONDIR (6 bytes)
                bw.Write((ushort)0); // Reserved
                bw.Write((ushort)1); // Type 1 = ICO
                bw.Write((ushort)sizes.Length); // Image count

                // ICONDIRENTRY (16 bytes each)
                int offset = 6 + (16 * sizes.Length);
                foreach (var entry in pngEntries)
                {
                    int s = entry.Key;
                    byte[] data = entry.Value;

                    byte w = (byte)(s >= 256 ? 0 : s);
                    byte h = (byte)(s >= 256 ? 0 : s);

                    bw.Write(w);
                    bw.Write(h);
                    bw.Write((byte)0); // Color count
                    bw.Write((byte)0); // Reserved
                    bw.Write((ushort)1); // Planes
                    bw.Write((ushort)32); // BitCount
                    bw.Write((uint)data.Length); // BytesInRes
                    bw.Write((uint)offset); // ImageOffset

                    offset += data.Length;
                }

                // Write PNG payload
                foreach (var entry in pngEntries)
                {
                    bw.Write(entry.Value);
                }
            }

            Console.WriteLine("Generated valid multi-res ICO: " + outIco);
            Console.WriteLine("Resolutions: 16, 24, 32, 48, 64, 128, 256");
        }

        static Bitmap DrawJawalang(int size)
        {
            Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.Clear(Color.Transparent);

                float scale = size / 256.0f;

                // Squircle background
                float rx = 14.0f * scale;
                float ry = 14.0f * scale;
                float rw = 228.0f * scale;
                float rh = 228.0f * scale;
                float radius = 48.0f * scale;
                float diameter = radius * 2.0f;

                using (GraphicsPath bgPath = new GraphicsPath())
                {
                    bgPath.AddArc(rx, ry, diameter, diameter, 180, 90);
                    bgPath.AddArc(rx + rw - diameter, ry, diameter, diameter, 270, 90);
                    bgPath.AddArc(rx + rw - diameter, ry + rh - diameter, diameter, diameter, 0, 90);
                    bgPath.AddArc(rx, ry + rh - diameter, diameter, diameter, 90, 90);
                    bgPath.CloseFigure();

                    // Fill dark navy background (#181B2E)
                    using (SolidBrush bgBrush = new SolidBrush(Color.FromArgb(255, 24, 27, 46)))
                    {
                        g.FillPath(bgBrush, bgPath);
                    }

                    // Gold border (#F59E0B)
                    float borderW = Math.Max(1.0f, 6.0f * scale);
                    using (Pen borderPen = new Pen(Color.FromArgb(255, 245, 158, 11), borderW))
                    {
                        g.DrawPath(borderPen, bgPath);
                    }
                }

                // Brackets '<' and '>' (Cyan #38BDF8)
                if (size >= 32)
                {
                    float bW = Math.Max(1.5f, 14.0f * scale);
                    using (Pen bracketPen = new Pen(Color.FromArgb(255, 56, 189, 248), bW))
                    {
                        bracketPen.StartCap = LineCap.Round;
                        bracketPen.EndCap = LineCap.Round;
                        bracketPen.LineJoin = LineJoin.Round;

                        // Left '<'
                        g.DrawLines(bracketPen, new PointF[] {
                            new PointF(76.0f * scale, 96.0f * scale),
                            new PointF(48.0f * scale, 128.0f * scale),
                            new PointF(76.0f * scale, 160.0f * scale)
                        });

                        // Right '>'
                        g.DrawLines(bracketPen, new PointF[] {
                            new PointF(180.0f * scale, 96.0f * scale),
                            new PointF(208.0f * scale, 128.0f * scale),
                            new PointF(180.0f * scale, 160.0f * scale)
                        });
                    }
                }

                // Central 'J' (Gold/Amber #FBBF24)
                float jW = Math.Max(2.0f, 20.0f * scale);
                using (Pen jPen = new Pen(Color.FromArgb(255, 251, 191, 36), jW))
                {
                    jPen.StartCap = LineCap.Round;
                    jPen.EndCap = LineCap.Round;
                    jPen.LineJoin = LineJoin.Round;

                    if (size <= 24)
                    {
                        // Simplified clear glyph for 16x16 and 24x24
                        g.DrawLines(jPen, new PointF[] {
                            new PointF(142.0f * scale, 68.0f * scale),
                            new PointF(142.0f * scale, 148.0f * scale),
                            new PointF(114.0f * scale, 182.0f * scale),
                            new PointF(82.0f * scale, 158.0f * scale)
                        });
                    }
                    else
                    {
                        using (GraphicsPath jPath = new GraphicsPath())
                        {
                            jPath.AddLine(148.0f * scale, 76.0f * scale, 148.0f * scale, 144.0f * scale);
                            jPath.AddBezier(
                                148.0f * scale, 144.0f * scale,
                                148.0f * scale, 172.0f * scale,
                                124.0f * scale, 186.0f * scale,
                                98.0f * scale, 180.0f * scale
                            );
                            jPath.AddBezier(
                                98.0f * scale, 180.0f * scale,
                                82.0f * scale, 176.0f * scale,
                                72.0f * scale, 162.0f * scale,
                                70.0f * scale, 150.0f * scale
                            );
                            g.DrawPath(jPen, jPath);
                        }

                        // Top accent dot
                        float dotR = 9.0f * scale;
                        using (SolidBrush dotBrush = new SolidBrush(Color.FromArgb(255, 251, 191, 36)))
                        {
                            g.FillEllipse(dotBrush, (148.0f * scale) - dotR, (58.0f * scale) - dotR, dotR * 2.0f, dotR * 2.0f);
                        }
                    }
                }
            }
            return bmp;
        }
    }
}
`;

fs.writeFileSync(path.join(PROJECT, 'scripts', 'GenerateIcon.cs'), csContent, 'utf8');
console.log('Created scripts/GenerateIcon.cs');
