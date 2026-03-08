import struct
import zlib

def create_png(size, r, g, b):
    img_data = []
    for y in range(size):
        row = [0]  # Filter byte
        for x in range(size):
            cx = x - size/2
            cy = y - size/2
            dist = (cx**2 + cy**2) ** 0.5
            pad = size * 0.05
            if dist < size * 0.42 - pad:
                if dist < size * 0.25:
                    row.extend([min(255, r+30), min(255, g+10), min(255, b+10), 255])
                else:
                    row.extend([r, g, b, 255])
            elif dist < size * 0.48:
                alpha = int(255 * (1 - (dist - (size*0.42-pad)) / (size*0.06)))
                row.extend([r, g, b, max(0, alpha)])
            else:
                row.extend([0, 0, 0, 0])
        img_data.append(bytes(row))
    
    raw = b''.join(img_data)
    compressed = zlib.compress(raw)
    
    def png_chunk(t, data):
        length = struct.pack('>I', len(data))
        crc = struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
        return length + t + data + crc
    
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png += png_chunk(b'IHDR', ihdr_data)
    png += png_chunk(b'IDAT', compressed)
    png += png_chunk(b'IEND', b'')
    return png

for size in [16, 32, 48, 128]:
    data = create_png(size, 255, 107, 107)
    with open(f'icon{size}.png', 'wb') as f:
        f.write(data)
    print(f'Created icon{size}.png ({size}x{size})')
