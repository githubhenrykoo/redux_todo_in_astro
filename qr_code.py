import qrcode

url = "http://localhost:4321/playwright"
qr = qrcode.make(url)
qr.save("qr_code.png")
