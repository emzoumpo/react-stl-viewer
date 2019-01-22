import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScaleLoader } from 'halogenium';
import Paint from './Paint';

class STLViewer extends Component {
  static propTypes = {
    className: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    width: PropTypes.number,
    height: PropTypes.number,
    backgroundColor: PropTypes.string,
    modelColors: PropTypes.arrayOf(PropTypes.string),
    rotate: PropTypes.bool,
    orbitControls: PropTypes.bool,
    cameraX: PropTypes.number,
    cameraY: PropTypes.number,
    cameraZ: PropTypes.number,
    lightX: PropTypes.number,
    lightY: PropTypes.number,
    lightZ: PropTypes.number,
    lightColor: PropTypes.string,
    rotationSpeeds: PropTypes.arrayOf(PropTypes.number)
  };

  static defaultProps = {
    backgroundColor: '#EAEAEA',
    modelColors: ['#FF0000', '#00FF00'],
    height: 400,
    width: 400,
    rotate: true,
    orbitControls: true,
    cameraX: 0,
    cameraY: 0,
    cameraZ: null,
    lightX: 0,
    lightY: 0,
    lightZ: 1,
    lightColor: '#ffffff',
    rotationSpeeds: [0, 0, 0.02]
  };

  componentDidMount() {
    console.log(this);
    this.paint = new Paint();
    this.paint.init(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return JSON.stringify(nextProps) !== JSON.stringify(this.props);
  }

  componentWillUpdate(nextProps, nextState) {
    this.props = nextProps;
    this.paint.init(this);
  }

  componentWillUnmount() {
    this.paint.clean();
    delete this.paint;
  }

  render() {
    const { width, height, modelColors } = this.props;

    return (
      <div
        className={this.props.className}
        style={{
          width: width,
          height: height,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ScaleLoader color={modelColors[0]} size="16px" />
        </div>
      </div>
    );
  }
}

module.exports = STLViewer;
