import { t } from 'element-ui-custom-ac/src/locale';

export default {
  methods: {
    t(...args) {
      return t.apply(this, args);
    }
  }
};
