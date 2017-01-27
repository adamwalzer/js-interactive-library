export default function (props, opts = {}) {
    return (
        <$k.Component className="selectable-reveal">
            <$k.MediaCollection
                play={_.get(props, 'data.reveal.open')}
                children={opts.media}
                {...opts.MediaCollectionProps}
            />
            <$k.Selectable
                dataTarget="selectable"
                list={opts.selectables}
                {...opts.SelectableProps}
            />
            <$k.Reveal
                openTarget="reveal"
                openReveal={_.get(props, 'data.selectable.target.props.message')}
                list={opts.reveals}
                {...opts.RevealProps}
            />
        </$k.Component>
    );
}
