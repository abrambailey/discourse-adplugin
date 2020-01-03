import AdComponent from "discourse/plugins/discourse-adplugin/discourse/components/ad-component";
import {
  default as computed,
  observes
} from "ember-addons/ember-computed-decorators";

const adIndex = {
  topic_list_top: null,
  topic_above_post_stream: null,
  topic_above_suggested: null,
  post_bottom: null
};

export default AdComponent.extend({
  classNames: ["house-creative"],
  classNameBindings: ["adUnitClass"],
  adHtml: "",

  @computed("placement", "showAd")
  adUnitClass(placement, showAd) {
    return showAd ? `house-${placement}` : "";
  },

  @computed("showToGroups", "showAfterPost", "showOnCurrentPage")
  showAd(showToGroups, showAfterPost, showOnCurrentPage) {
    return showToGroups && showAfterPost && showOnCurrentPage;
  },

  @computed("postNumber")
  showAfterPost(postNumber) {
    if (!postNumber) {
      return true;
    }

    return this.isNthPost(
      parseInt(this.site.get("house_creatives.settings.after_nth_post"), 10)
    );
  },

  chooseAdHtml() {
    const houseAds = this.site.get("house_creatives"),
      placement = this.get("placement").replace(/-/g, "_"),
      adNames = this.adsNamesForSlot(placement);

    if (adNames.length > 0) {
      if (!adIndex[placement]) {
        adIndex[placement] = 0;
      }
      let ad = houseAds.creatives[adNames[adIndex[placement]]] || "";
      adIndex[placement] = (adIndex[placement] + 1) % adNames.length;
      try {
        var json = JSON.parse(ad);
        var url = json.url;
        var h = 'auto';
        if (json.mobileHeight && this.site.mobileView) {
          h = json.mobileHeight;
        } else if (json.desktopHeight && !this.site.mobileView) {
          h = json.desktopHeight;
        } else if (json.height) {
          h = json.height;
        }
        var w = '100%'
        if (json.mobileWidth && this.site.mobileView) {
          w = json.mobileWidth;
        } else if (json.desktopWidth && !this.site.mobileView) {
          w = json.desktopWidth;
        } else if (json.width && !this.site.mobileView) {
          w = json.width;
        }
        var other = '';
        if (json.params) {
          other = '&' + json.params;
        }
        return `<iframe src="${url}?mobile=${this.site.mobileView}&iw=${window.innerWidth}&ih=${window.innerHeight}&w=${document.body.clientWidth}&h=${document.body.clientHeight}&path=${window.location.pathname}${other}" frameborder="0" width="${w}" height="${h}"></iframe>`;
      } catch (ex) {}

      return ad;
    } else {
      return "";
    }
  },

  adsNamesForSlot(placement) {
    const houseAds = this.site.get("house_creatives");

    if (!houseAds || !houseAds.settings) {
      return [];
    }

    const adsForSlot = houseAds.settings[placement];

    if (
      Object.keys(houseAds.creatives).length > 0 &&
      !Ember.isBlank(adsForSlot)
    ) {
      return adsForSlot.split("|");
    } else {
      return [];
    }
  },

  @observes("refreshOnChange")
  refreshAd() {
    if (this.get("listLoading")) {
      return;
    }

    this.set("adHtml", this.chooseAdHtml());
  },

  didInsertElement() {
    this._super(...arguments);

    if (!this.get("showAd")) {
      return;
    }

    if (this.get("listLoading")) {
      return;
    }

    if (adIndex.topic_list_top === null) {
      // start at a random spot in the ad inventory
      Object.keys(adIndex).forEach(placement => {
        const adNames = this.adsNamesForSlot(placement);
        adIndex[placement] = Math.floor(Math.random() * adNames.length);
      });
    }

    this.refreshAd();
  }
});
