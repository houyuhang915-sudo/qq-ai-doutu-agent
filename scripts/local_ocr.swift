import Foundation
import Vision
import ImageIO

struct OCRLinePayload: Encodable {
  let text: String
  let minX: Double
  let minY: Double
  let maxX: Double
  let maxY: Double
}

struct OCRPayload: Encodable {
  let ok: Bool
  let lines: [String]
  let blocks: [OCRLinePayload]
  let fullText: String
}

func printJson(_ payload: OCRPayload) {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.withoutEscapingSlashes]

  if let data = try? encoder.encode(payload), let text = String(data: data, encoding: .utf8) {
    FileHandle.standardOutput.write(Data(text.utf8))
  } else {
    FileHandle.standardOutput.write(Data("{\"ok\":false,\"lines\":[],\"blocks\":[],\"fullText\":\"\"}".utf8))
  }
}

guard CommandLine.arguments.count > 1 else {
  printJson(OCRPayload(ok: false, lines: [], blocks: [], fullText: ""))
  exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

guard
  let source = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  printJson(OCRPayload(ok: false, lines: [], blocks: [], fullText: ""))
  exit(2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.minimumTextHeight = 0.015
request.recognitionLanguages = ["zh-Hans", "en-US"]

let handler = VNImageRequestHandler(cgImage: image, options: [:])

do {
  try handler.perform([request])

  let blocks = (request.results ?? [])
    .compactMap { observation -> OCRLinePayload? in
      guard
        let candidate = observation.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines),
        !candidate.isEmpty
      else {
        return nil
      }

      let box = observation.boundingBox
      return OCRLinePayload(
        text: candidate,
        minX: Double(box.minX),
        minY: Double(box.minY),
        maxX: Double(box.maxX),
        maxY: Double(box.maxY)
      )
    }
    .sorted {
      if abs($0.maxY - $1.maxY) > 0.015 {
        return $0.maxY > $1.maxY
      }

      return $0.minX < $1.minX
    }

  let lines = blocks.map(\.text)

  let payload = OCRPayload(
    ok: true,
    lines: lines,
    blocks: blocks,
    fullText: lines.joined(separator: "\n")
  )
  printJson(payload)
} catch {
  printJson(OCRPayload(ok: false, lines: [], blocks: [], fullText: ""))
  exit(3)
}
