import {IAudioMetadata, IOptions} from "../";
import {Promise} from "es6-promise";
import * as strtok3 from "strtok3/lib/browser";
import {MusicMetadataParser} from "../MusicMetadataParser";
import * as Stream from "stream";

/**
 * Get audio track using XML-HTTP-Request (XHR).
 * @param {string} url URL to read from
 * @param {IOptions} opts Options
 * @returns {Promise<IAudioMetadata>}
 */
export function parseUrl(url: string, opts?: IOptions): Promise<IAudioMetadata> {

  return strtok3.fromUrl(url).then(tokenizer => {
    opts.contentType = tokenizer.contentType || opts.contentType;
    return new MusicMetadataParser().parse(tokenizer, opts); // ToDo: mime type
  });
}

/**
 * Parse audio from stream
 * @param stream Node stream
 * @param mimeType The mime-type, e.g. "audio/mpeg", extension e.g. ".mp3" or filename. This is used to redirect to the correct parser.
 * @param opts Parsing options
 *   .native=true    Will return original header in result
 *   .mergeTagHeaders=false  Populate common from data of all headers available
 * @returns {Promise<IAudioMetadata>}
 */
export function parseStream(stream: Stream.Readable, mimeType?: string, opts?: IOptions): Promise<IAudioMetadata> {
  opts.contentType = mimeType || opts.contentType;
  return strtok3.fromStream(stream).then(tokenizer => {
    return new MusicMetadataParser().parse(tokenizer, opts);
  });
}
