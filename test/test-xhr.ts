/* tslint:disable */

import {assert} from 'chai';
import * as mm from '../src/browser';

describe("XhrReader", () => {

  it("Milla's Dream.mp3 from Cover Archive", () => {

    const url = "https://archive.org/download/ParovPrincess/Parov%20Stelar%20-%20The%20Princess/CD1/01%20-%20Milla's%20Dream.mp3";

    return mm.parseUrl(url, {duration: true, native: true}).then(metadata => {
      assert.approximately(metadata.format.duration, 3 * 60 + 44, 0.5);
    });
  });

  it("Diablo Swing Orchestra - Heroines", () => {

    const url = "https://cdn.rawgit.com/captbaritone/webamp-music/4b556fbf/Diablo_Swing_Orchestra_-_01_-_Heroines.mp3";

    return mm.parseUrl(url, {duration: true, native: true}).then(metadata => {
      assert.approximately(metadata.format.duration, 323, 0.5);
    });
  });

});

