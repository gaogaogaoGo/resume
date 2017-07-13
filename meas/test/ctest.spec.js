/**
 * Created by cyq on 2017/4/20.
 */
import Test from '../src/ctest';

describe(' Emtp_Cloud_Platform Test', function() {
    let polygon = new Test(5, 3);

    it('should return 15 when calling calcArea', function() {

        assert.equal(15, polygon.calcArea());
    });
});