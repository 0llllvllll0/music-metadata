import {CombinedTagMapper, IAudioMetadata, INativeAudioMetadata, IOptions} from "./";
import {TagPriority, TagType} from "./common/GenericTagTypes";
import {ParserFactory} from "./ParserFactory";
import {Promise} from "es6-promise";
import {ITokenizer} from "strtok3";

export class MusicMetadataParser {

  public static joinArtists(artists: string[]): string {
    if (artists.length > 2) {
      return artists.slice(0, artists.length - 1).join(', ') + ' & ' + artists[artists.length - 1];
    }
    return artists.join(' & ');
  }

  private tagMapper = new CombinedTagMapper();

  /**
   * Parse data provided by tokenizer.
   * @param {ITokenizer} tokenizer feed input (abstracting input)
   * @param {IOptions} options
   * @returns {Promise<IAudioMetadata>}
   */
  public parse(tokenizer: ITokenizer, options?: IOptions): Promise<IAudioMetadata> {
    if (!tokenizer.fileSize && options.fileSize) {
      tokenizer.fileSize = options.fileSize;
    }
    return ParserFactory.parse(tokenizer, options).then(nativeTags => {
      return this.parseNativeTags(nativeTags, options.native, options.mergeTagHeaders);
    });
  }

  /**
   * Convert native tags to common tags
   * @param nativeData
   * @param includeNative return native tags in result
   * @param mergeTagHeaders Merge tah headers
   * @returns {IAudioMetadata} Native + common tags
   */
  public parseNativeTags(nativeData: INativeAudioMetadata, includeNative?: boolean, mergeTagHeaders?: boolean): IAudioMetadata {

    const metadata: IAudioMetadata = {
      format: nativeData.format,
      native: includeNative ? nativeData.native : undefined,
      common: {} as any
    };

    metadata.format.tagTypes = [];

    for (const tagType in nativeData.native) {
      metadata.format.tagTypes.push(tagType as TagType);
    }

    for (const tagType of TagPriority) {

      if (nativeData.native[tagType]) {
        if (nativeData.native[tagType].length === 0) {
          // ToDo: register warning: empty tag header
        } else {

          const common = {
            track: {no: null, of: null},
            disk: {no: null, of: null}
          };

          for (const tag of nativeData.native[tagType]) {
            this.tagMapper.setGenericTag(common, tagType as TagType, tag);
          }

          for (const tag of Object.keys(common)) {
            if (!metadata.common[tag]) {
              metadata.common[tag] = common[tag];
            }
          }

          if (!mergeTagHeaders) {
            break;
          }
        }
      }
    }

    if (metadata.common.artists && metadata.common.artists.length > 0) {
      // common.artists explicitly by meta-data
      metadata.common.artist = !metadata.common.artist ? MusicMetadataParser.joinArtists(metadata.common.artists) : metadata.common.artist[0];
    } else {
      if (metadata.common.artist) {
        metadata.common.artists = metadata.common.artist as any;
        if (metadata.common.artist.length > 1) {
          delete metadata.common.artist;
        } else {
          metadata.common.artist = metadata.common.artist[0];
        }
      }
    }
    return metadata;
  }
}
